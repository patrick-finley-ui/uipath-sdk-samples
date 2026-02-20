import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AuthProvider } from './hooks/useAuth';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { UiPathError } from '@uipath/uipath-typescript/core';
import type { UiPathSDKConfig } from '@uipath/uipath-typescript/core';
import { Entities } from '@uipath/uipath-typescript/entities';
import { EntityType } from '@uipath/uipath-typescript/entities';
import type { EntityGetResponse } from '@uipath/uipath-typescript/entities';

type Role = 'assistant' | 'user';

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
};

type EntitySummary = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  entityType: EntityType;
  fieldCount: number;
  recordCount: number;
};

const authConfig: UiPathSDKConfig = {
  clientId: import.meta.env.VITE_UIPATH_CLIENT_ID || 'your-client-id',
  orgName: import.meta.env.VITE_UIPATH_ORG_NAME || 'your-organization',
  tenantName: import.meta.env.VITE_UIPATH_TENANT_NAME || 'your-tenant',
  baseUrl: import.meta.env.VITE_UIPATH_BASE_URL || 'https://staging.uipath.com',
  redirectUri: import.meta.env.VITE_UIPATH_REDIRECT_URI || window.location.origin,
  scope: import.meta.env.VITE_UIPATH_SCOPES || 'DataFabric.Schema.Read',
};

const typeLabels: Record<EntityType, string> = {
  [EntityType.Entity]: 'Entity',
  [EntityType.ChoiceSet]: 'ChoiceSet',
  [EntityType.InternalEntity]: 'InternalEntity',
  [EntityType.SystemEntity]: 'SystemEntity',
};

const supportedTypes = Object.values(EntityType);

function toSummary(entity: EntityGetResponse): EntitySummary {
  return {
    id: entity.id,
    name: entity.name,
    displayName: entity.displayName,
    description: entity.description || 'No description provided.',
    entityType: entity.entityType,
    fieldCount: entity.fields.length,
    recordCount: entity.recordCount ?? 0,
  };
}

function getTypeCounts(entities: EntitySummary[]): Record<EntityType, number> {
  return entities.reduce(
    (acc, item) => {
      acc[item.entityType] += 1;
      return acc;
    },
    {
      [EntityType.Entity]: 0,
      [EntityType.ChoiceSet]: 0,
      [EntityType.InternalEntity]: 0,
      [EntityType.SystemEntity]: 0,
    }
  );
}

function findRequestedType(question: string): EntityType | null {
  const normalized = question.toLowerCase();
  for (const value of supportedTypes) {
    if (normalized.includes(value.toLowerCase())) {
      return value;
    }
  }
  if (normalized.includes('choice set') || normalized.includes('choiceset')) {
    return EntityType.ChoiceSet;
  }
  if (normalized.includes('system')) {
    return EntityType.SystemEntity;
  }
  if (normalized.includes('internal')) {
    return EntityType.InternalEntity;
  }
  if (normalized.includes('entity') || normalized.includes('table')) {
    return EntityType.Entity;
  }
  return null;
}

function answerQuestion(question: string, entities: EntitySummary[]): string {
  const normalized = question.toLowerCase().trim();
  const counts = getTypeCounts(entities);

  if (!normalized) {
    return 'Ask me about entity types, counts, or details for a specific entity.';
  }

  if (normalized.includes('how many') && normalized.includes('type')) {
    return [
      `I found ${entities.length} total entities in your tenant:`,
      `- Entity: ${counts[EntityType.Entity]}`,
      `- ChoiceSet: ${counts[EntityType.ChoiceSet]}`,
      `- InternalEntity: ${counts[EntityType.InternalEntity]}`,
      `- SystemEntity: ${counts[EntityType.SystemEntity]}`,
    ].join('\n');
  }

  if (normalized.includes('list') && (normalized.includes('entity') || normalized.includes('type'))) {
    const requestedType = findRequestedType(normalized);
    if (requestedType) {
      const matching = entities.filter((entity) => entity.entityType === requestedType);
      if (matching.length === 0) {
        return `No ${typeLabels[requestedType]} entries are available in this environment.`;
      }
      const preview = matching
        .slice(0, 20)
        .map((entity) => `- ${entity.displayName} (${entity.name})`)
        .join('\n');
      const suffix =
        matching.length > 20
          ? `\n...and ${matching.length - 20} more ${typeLabels[requestedType]} entries.`
          : '';
      return `${typeLabels[requestedType]} entries (${matching.length}):\n${preview}${suffix}`;
    }

    const preview = entities
      .slice(0, 20)
      .map((entity) => `- ${entity.displayName} (${typeLabels[entity.entityType]})`)
      .join('\n');
    const suffix = entities.length > 20 ? `\n...and ${entities.length - 20} more.` : '';
    return `All entities (${entities.length}):\n${preview}${suffix}`;
  }

  if (normalized.includes('what types') || normalized.includes('types available')) {
    const available = supportedTypes
      .filter((type) => counts[type] > 0)
      .map((type) => `${typeLabels[type]} (${counts[type]})`)
      .join(', ');

    return available
      ? `Entity types present in this tenant: ${available}.`
      : 'No entities were returned from Data Fabric yet.';
  }

  const entityMatch = entities.find((entity) => {
    const display = entity.displayName.toLowerCase();
    const name = entity.name.toLowerCase();
    return normalized.includes(display) || normalized.includes(name);
  });

  if (entityMatch) {
    return [
      `${entityMatch.displayName} (${entityMatch.name})`,
      `- Type: ${typeLabels[entityMatch.entityType]}`,
      `- Fields: ${entityMatch.fieldCount}`,
      `- Record count: ${entityMatch.recordCount}`,
      `- Description: ${entityMatch.description}`,
    ].join('\n');
  }

  return [
    'I can help with questions like:',
    '- "How many entities do we have by type?"',
    '- "List system entities"',
    '- "What types are available?"',
    '- "Tell me about <entity name>"',
  ].join('\n');
}

function AgentWorkspace() {
  const { sdk } = useAuth();
  const entitiesService = useMemo(() => new Entities(sdk), [sdk]);

  const [entities, setEntities] = useState<EntitySummary[]>([]);
  const [isLoadingEntities, setIsLoadingEntities] = useState(true);
  const [entityError, setEntityError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'I am ready. Ask about entity types, counts, or details for a specific entity.',
    },
  ]);

  useEffect(() => {
    const loadEntities = async () => {
      setIsLoadingEntities(true);
      setEntityError(null);

      try {
        const result = await entitiesService.getAll();
        const normalized = result.map(toSummary).sort((a, b) => a.displayName.localeCompare(b.displayName));
        setEntities(normalized);
      } catch (err) {
        setEntityError(err instanceof UiPathError ? err.message : 'Failed to fetch entities.');
      } finally {
        setIsLoadingEntities(false);
      }
    };

    void loadEntities();
  }, [entitiesService]);

  const counts = useMemo(() => getTypeCounts(entities), [entities]);

  const onAsk = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const userText = question.trim();
    if (!userText) {
      return;
    }

    const assistantAnswer = answerQuestion(userText, entities);
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: userText },
      { id: `a-${Date.now()}-reply`, role: 'assistant', content: assistantAnswer },
    ]);
    setQuestion('');
  };

  return (
    <main className="max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={entities.length} />
        <StatCard label="Entity" value={counts[EntityType.Entity]} />
        <StatCard label="ChoiceSet" value={counts[EntityType.ChoiceSet]} />
        <StatCard label="System/Internal" value={counts[EntityType.SystemEntity] + counts[EntityType.InternalEntity]} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-900">Tenant Entities</h2>
          <p className="text-sm text-gray-500 mt-1">Loaded from Data Fabric using `Entities.getAll()`.</p>

          {isLoadingEntities && <p className="text-sm text-gray-600 mt-4">Loading entities...</p>}
          {entityError && <p className="text-sm text-red-700 mt-4">{entityError}</p>}

          {!isLoadingEntities && !entityError && (
            <ul className="mt-4 divide-y divide-gray-100 max-h-[28rem] overflow-auto">
              {entities.map((entity) => (
                <li key={entity.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{entity.displayName}</p>
                      <p className="text-xs text-gray-500">{entity.name}</p>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700">
                      {typeLabels[entity.entityType]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{entity.description}</p>
                </li>
              ))}
              {entities.length === 0 && <li className="py-3 text-sm text-gray-500">No entities found.</li>}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 p-5 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900">Entity Q&A Agent</h2>
          <p className="text-sm text-gray-500 mt-1">Ask about types, counts, and specific entity details.</p>

          <div className="mt-4 flex-1 space-y-3 overflow-auto max-h-[24rem] pr-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === 'assistant' ? 'bg-gray-50 rounded-lg p-3 text-sm' : 'bg-blue-50 rounded-lg p-3 text-sm'}
              >
                <p className="font-semibold text-xs uppercase tracking-wide text-gray-500 mb-1">{message.role}</p>
                <pre className="whitespace-pre-wrap font-sans text-gray-800">{message.content}</pre>
              </div>
            ))}
          </div>

          <form onSubmit={onAsk} className="mt-4 flex gap-2">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Example: How many entities by type?"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Ask
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 font-medium">Initializing UiPath SDK...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        appName="Conversational Entity Agent"
        appDescription="Entity inventory and Q&A assistant"
        systemFeatures={[
          'Fetches all Data Fabric entities in your tenant',
          'Groups entities by EntityType automatically',
          'Answers natural-language questions about entity types',
          'Provides metadata for named entities',
        ]}
        detailedDescription="Sign in with a UiPath External App that includes DataFabric.Schema.Read scope."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <AgentWorkspace />
    </div>
  );
}

function App() {
  return (
    <AuthProvider config={authConfig}>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
