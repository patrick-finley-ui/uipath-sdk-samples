import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import sdk, { initializeSdk } from '../uipath';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './FormStyles.css';
import { resolveAssetUrl } from './utils';
import companyLogo from '../assets/uipath-corporate-logo-digital-rgb-w.png';

// Import mock helpers for local development (automatically available in browser console)
import { mockActionCenterData, registerMockCallback } from '../mockActionCenter';
import loanConfig from '../../examples/loan-application-config.json';
import claimConfig from '../../examples/insurance-claim-config.json';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentAttachment {
  name: string;
  filePath: string;
  size?: string;
  uploadDate?: string;
}

// Configuration interfaces
interface EntityFieldConfig {
  label: string;
  mapping: string;
}

interface ReadOnlyFieldConfig {
  label: string;
  value?: string;
}

interface OutputFieldConfig {
  type: 'string' | 'number' | 'integer' | 'textarea';
  required?: boolean;
}

interface OutcomeConfig {
  type: string;
  label: string;
}

// Dynamic form data - keys are based on outputFields configuration
interface FormData {
  [key: string]: string | number | undefined;
  storageBucketId?: number;
  filePath?: string;
  aiAgentHTML?: string;
}

// Entity history record - dynamic based on entityFields
interface EntityHistoryRecord {
  id: number;
  [key: string]: string | number | undefined;
}

type TabType = 'review' | 'applicant' | 'application';

const Form = () => {
  // ============================================================================
  // STATE MANAGEMENT (Data Storage)
  // ============================================================================
  // React uses "state" to store data that can change over time. When state changes,
  // the component automatically re-renders to show the updated data on screen.
  // Think of state as variables that trigger UI updates when they change.

  // Track which tab is currently active (Review, History, or Attachments)
  const [activeTab, setActiveTab] = useState<TabType>('review');

  // Multi-select tab view
  const [selectedTabs, setSelectedTabs] = useState<TabType[]>(['review']);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Collapsible document grid
  const [isDocumentGridOpen, setIsDocumentGridOpen] = useState(true);

  // Configuration from Action Center inputs
  const [entityId, setEntityId] = useState<string>('');
  const [entityFields, setEntityFields] = useState<Record<string, EntityFieldConfig>>({});
  const [readOnlyFields, setReadOnlyFields] = useState<Record<string, ReadOnlyFieldConfig>>({});
  const [outputFields, setOutputFields] = useState<Record<string, OutputFieldConfig>>({});
  const [outcomes, setOutcomes] = useState<Record<string, OutcomeConfig>>({});

  // Store all the form field values entered by the user (dynamic based on outputFields)
  const [formData, setFormData] = useState<FormData>({});

  // Store entity history data fetched from UiPath Data Fabric
  const [entityHistory, setEntityHistory] = useState<EntityHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);  // Track if we're currently loading history
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);  // Track if we've already loaded history once

  // Store PDF document data
  const [numPages, setNumPages] = useState<number | null>(null);    // Total pages in the PDF
  const [pageNumber, setPageNumber] = useState(1);                  // Current page being viewed
  const [documentUrl, setDocumentUrl] = useState<string>('');       // URL to the PDF file
  const [isLoadingDocument, setIsLoadingDocument] = useState(false); // Track if we're currently loading document
  const [pdfScale, setPdfScale] = useState(1.40);                    // PDF zoom scale
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState<number>(0); // Currently selected document from list
  const [loadedDocumentUrls, setLoadedDocumentUrls] = useState<Map<number, string>>(new Map()); // Cache of loaded document URLs

  // Store list of documents fetched from bucket
  const [availableDocuments, setAvailableDocuments] = useState<DocumentAttachment[]>([]);
  const [isLoadingDocumentList, setIsLoadingDocumentList] = useState(false);

  // Pagination for documents
  const [documentPage, setDocumentPage] = useState(1);
  const documentsPerPage = 5;

  // Pagination for loan history
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 10;

  // Store data received from UiPath Action Center (org info, auth tokens, etc.)
  const [actionCenterData, setActionCenterData] = useState<any>(null);

  // ============================================================================
  // LIFECYCLE HOOK: Initialize from Action Center
  // ============================================================================
  // useEffect runs code when the component first loads or when dependencies change.
  // This one runs ONCE when the form first loads (empty [] means no dependencies).
  // It receives initial data from UiPath Action Center and sets up authentication.
  useEffect(() => {
    // Define the callback function
    const actionCenterCallback = (data: any) => {
      // Populate configuration from Action Center task data
      if (data.data) {
        console.log('📥 Received Action Center data:', data.data);
        
        // Set configuration
        if (data.data.entityId) setEntityId(data.data.entityId);
        if (data.data.entityFields) {
          console.log('📋 Setting entityFields:', data.data.entityFields);
          setEntityFields(data.data.entityFields);
        }
        if (data.data.readOnlyFields) {
          console.log('📋 Setting readOnlyFields:', data.data.readOnlyFields);
          setReadOnlyFields(data.data.readOnlyFields);
        }
        if (data.data.outputFields) {
          console.log('📋 Setting outputFields:', data.data.outputFields);
          setOutputFields(data.data.outputFields);
        }
        if (data.data.outcomes) {
          console.log('📋 Setting outcomes:', data.data.outcomes);
          setOutcomes(data.data.outcomes);
        }

        // Initialize form data dynamically based on outputFields
        const initialFormData: FormData = {};
        
        // Initialize output fields
        if (data.data.outputFields) {
          Object.keys(data.data.outputFields).forEach((fieldName) => {
            initialFormData[fieldName] = data.data[fieldName] || '';
          });
        }

        // Set storage bucket ID
        if (data.data.storageBucketId !== undefined) {
          initialFormData.storageBucketId = typeof data.data.storageBucketId === 'string'
            ? parseInt(data.data.storageBucketId, 10)
            : data.data.storageBucketId || 0;
        }

        // Set file path if provided
        if (data.data.filePath !== undefined) {
          initialFormData.filePath = data.data.filePath || '';
        }

        // Set AI agent HTML if provided
        if (data.data.aiAgentHTML) {
          initialFormData.aiAgentHTML = data.data.aiAgentHTML;
        }

        // Preserve any existing form data values
        Object.keys(data.data).forEach((key) => {
          if (key !== 'entityId' && key !== 'entityFields' && key !== 'readOnlyFields' && 
              key !== 'outputFields' && key !== 'outcomes' && key !== 'storageBucketId' && 
              key !== 'filePath' && key !== 'aiAgentHTML') {
            // If it's an output field, preserve it
            if (data.data.outputFields && data.data.outputFields[key]) {
              initialFormData[key] = data.data[key] || '';
            }
          }
        });

        setFormData(initialFormData);
      }

      // Initialize the UiPath SDK with org/tenant/session details from Action Center
      if (data.baseUrl && data.orgName && data.tenantName && data.token) {
        initializeSdk({
          baseUrl: data.baseUrl,
          orgName: data.orgName,
          tenantName: data.tenantName,
          token: data.token
        });
      }

      // Update the SDK authentication token if a new one was provided
      if (data.newToken) {
        sdk.updateToken(data.newToken);
      }

      // Store the full Action Center data for later use (needed for API calls)
      setActionCenterData(data);
    };
    
    // Register the callback with SDK
    sdk.taskEvents.getTaskDetailsFromActionCenter(actionCenterCallback);
    
    // Register callback for mock data (local testing)
    if (import.meta.env.DEV) {
      registerMockCallback(actionCenterCallback);
      // Load mock data after a short delay to ensure everything is set up
      setTimeout(() => {
        mockActionCenterData(claimConfig);
      }, 100);
    }

    // Initialize the task event system in Action Center
    sdk.taskEvents.initializeInActionCenter();
  }, []); // Empty array = run only once when component mounts

  // ============================================================================
  // LIFECYCLE HOOK: Load Entity History from Data Fabric (API Call)
  // ============================================================================
  // This useEffect runs whenever the user switches tabs. It loads entity history
  // data from UiPath Data Fabric when the "Applicant History" tab is clicked.
  // It only loads once per session to avoid unnecessary API calls.
  useEffect(() => {
    // Only load if: user is on applicant tab AND data hasn't been loaded yet AND we have entityId
    if (activeTab === 'applicant' && !hasLoadedHistory && !isLoadingHistory && entityId) {
      const loadEntityHistory = async () => {
        try {
          setIsLoadingHistory(true); // Show loading spinner

          // API CALL: Fetch entity records from UiPath Data Fabric
          const response = await sdk.entities.getRecordsById(entityId, {
            pageSize: 5,           // Get up to 5 records
            expansionLevel: 1      // Include related data
          });
          console.log('Entity history response:', response);

          // Transform the API response data into the format our UI expects
          if (response && response.items && Object.keys(entityFields).length > 0) {
            const mappedHistory = response.items.map((record: any, index: number) => {
              const mappedRecord: EntityHistoryRecord = { id: index + 1 };
              
              // Map each field using entityFields configuration
              Object.entries(entityFields).forEach(([fieldName, fieldConfig]) => {
                const dataFabricValue = record[fieldConfig.mapping];
                // Handle different field name variations (camelCase, PascalCase, etc.)
                const altValue = record[fieldConfig.mapping.charAt(0).toUpperCase() + fieldConfig.mapping.slice(1)] ||
                                 record[fieldConfig.mapping.toUpperCase()] ||
                                 record[fieldConfig.mapping.toLowerCase()];
                mappedRecord[fieldName] = dataFabricValue !== undefined ? dataFabricValue : (altValue !== undefined ? altValue : 'N/A');
              });
              
              return mappedRecord;
            });
            setEntityHistory(mappedHistory); // Update state with fetched data
          } else {
            setEntityHistory([]);
          }
          setHasLoadedHistory(true); // Mark as loaded so we don't load again
        } catch (error) {
          console.error('Error loading entity history:', error);
          setEntityHistory([]); // Set empty array on error
          setHasLoadedHistory(true);
        } finally {
          setIsLoadingHistory(false); // Hide loading spinner
        }
      };

      loadEntityHistory(); // Execute the async function
    }
  }, [activeTab, hasLoadedHistory, isLoadingHistory, entityId, entityFields]); // Run when these values change

  // ============================================================================
  // LIFECYCLE HOOK: Load Document List from Orchestrator Bucket (API Call)
  // ============================================================================
  // This useEffect runs when the user switches to the "Attachments" tab.
  // It fetches the list of available documents from the UiPath Orchestrator Bucket.
  useEffect(() => {
    // Only load if: user is on attachments tab AND we haven't loaded the list yet
    const bucketId = typeof formData.storageBucketId === 'number' ? formData.storageBucketId : 0;
    if (activeTab === 'application' && !isLoadingDocumentList && availableDocuments.length === 0 && bucketId && actionCenterData?.organizationUnitId) {
      const loadDocumentList = async () => {
        try {
          setIsLoadingDocumentList(true);
          console.log('Fetching document list from bucket:', bucketId);

          // Fetch all files from the bucket using getFileMetaData API
          const fileMetaData = await sdk.buckets.getFileMetaData(
            bucketId,
            actionCenterData.organizationUnitId
          );

          console.log('File metadata response:', fileMetaData);

          // Transform the response to DocumentAttachment format
          // The API returns NonPaginatedResponse, access items property
          const blobItems = (fileMetaData as any).items || (fileMetaData as any).blobItems || [];
          let documents: DocumentAttachment[] = blobItems.map((item: any) => {
            // Extract filename from path (remove leading slash)
            const fileName = item.path.replace(/^\//, '');

            // Format file size (convert bytes to KB or MB)
            let formattedSize = 'N/A';
            if (item.size) {
              if (item.size < 1024 * 1024) {
                formattedSize = `${(item.size / 1024).toFixed(1)} KB`;
              } else {
                formattedSize = `${(item.size / (1024 * 1024)).toFixed(1)} MB`;
              }
            }

            // Format date
            const formattedDate = item.lastModified
              ? new Date(item.lastModified).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              : 'N/A';

            return {
              name: fileName,
              filePath: item.path,
              size: formattedSize,
              uploadDate: formattedDate
            };
          });

          // Filter by filePath if provided
          const filePath = formData.filePath as string | undefined;
          if (filePath && filePath.trim() !== '') {
            documents = documents.filter(doc => doc.filePath.includes(filePath));
          }

          setAvailableDocuments(documents);
          console.log('Loaded documents:', documents);

          // Automatically load the first document
          if (documents.length > 0 && documents[0]) {
            await loadDocumentByPath(documents[0].filePath, 0);
          }
        } catch (error) {
          console.error('Error loading document list:', error);
          setAvailableDocuments([]);
        } finally {
          setIsLoadingDocumentList(false);
        }
      };

      loadDocumentList();
    }
  }, [activeTab, isLoadingDocumentList, availableDocuments.length, formData.storageBucketId, formData.filePath, actionCenterData]);

  // Reset document page when filePath changes
  useEffect(() => {
    setDocumentPage(1);
    setSelectedDocumentIndex(0);
  }, [formData.filePath]);

  // ============================================================================
  // EVENT HANDLERS (Functions that respond to user actions)
  // ============================================================================
  // These functions run when users interact with the form (typing, clicking, etc.)

  // Handle input field changes (runs every time user types in a field)
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;  // Get which field changed and its new value
    const updatedData = {
      ...formData,   // Keep all existing form data
      [name]: value  // Update only the field that changed
    }
    setFormData(updatedData);                    // Update local state
    sdk.taskEvents.dataChanged(updatedData);     // Notify Action Center of the change
  };


  // Handle form submission (prevent page reload)
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default browser form submission behavior
  };

  // Handle outcome button click (dynamic based on outcomes configuration)
  const handleOutcome = (outcomeName: string) => {
    // Prepare output data - only include fields defined in outputFields
    const outputData: Record<string, any> = {};
    Object.keys(outputFields).forEach((fieldName) => {
      if (formData[fieldName] !== undefined) {
        outputData[fieldName] = formData[fieldName];
      }
    });
    
    console.log(`Form completed with outcome "${outcomeName}":`, outputData);
    // Complete the task in Action Center with the specified outcome and send output data
    sdk.taskEvents.completeTask(outcomeName, outputData);
  };

  // ============================================================================
  // PDF VIEWER HELPER FUNCTIONS
  // ============================================================================

  // Called when PDF successfully loads - stores total page count
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Navigate to previous page (minimum page 1)
  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  // Navigate to next page (maximum is total page count)
  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
  };

  // Zoom in on PDF
  const zoomIn = () => {
    setPdfScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  // Zoom out on PDF
  const zoomOut = () => {
    setPdfScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  // Reset zoom to 100%
  const resetZoom = () => {
    setPdfScale(1.0);
  };

  // Load a document by its file path from Orchestrator Buckets
  const loadDocumentByPath = async (filePath: string, docIndex: number) => {
    // Check if already cached
    if (loadedDocumentUrls.has(docIndex)) {
      setDocumentUrl(loadedDocumentUrls.get(docIndex)!);
      return;
    }

    try {
      setIsLoadingDocument(true);
      console.log('Fetching document with path:', filePath);

      const bucketId = typeof formData.storageBucketId === 'number' ? formData.storageBucketId : 0;
      if (!bucketId || !actionCenterData?.organizationUnitId) {
        console.error('Missing bucket ID or organization unit ID');
        return;
      }

      const readUri = await sdk.buckets.getReadUri({
        bucketId: bucketId,
        folderId: actionCenterData.organizationUnitId,
        path: filePath
      });

      console.log('Read URI:', readUri);

      // Cache the URL
      const newCache = new Map(loadedDocumentUrls);
      newCache.set(docIndex, readUri.uri);
      setLoadedDocumentUrls(newCache);

      setDocumentUrl(readUri.uri);
    } catch (error) {
      console.error('Error fetching document URL:', error);
    } finally {
      setIsLoadingDocument(false);
    }
  };

  // Handle document selection from the list
  const handleDocumentSelect = async (filePath: string) => {
    // Find the document index in availableDocuments
    const docIndex = availableDocuments.findIndex(doc => doc.filePath === filePath);
    if (docIndex < 0) return;

    setSelectedDocumentIndex(docIndex);
    setPageNumber(1); // Reset to first page when switching documents
    setNumPages(null); // Reset page count

    const doc = availableDocuments[docIndex];
    if (doc) {
      await loadDocumentByPath(doc.filePath, docIndex);
    }
  };

  // Handle tab selection in multi-select mode
  const handleTabToggle = (tab: TabType) => {
    if (isMultiSelectMode) {
      setSelectedTabs(prev => {
        if (prev.includes(tab)) {
          // If already selected and trying to deselect, ensure at least one tab remains
          if (prev.length === 1) return prev;
          return prev.filter(t => t !== tab);
        } else {
          // If trying to select more than 2 tabs, replace the first one
          if (prev.length >= 2) {
            const secondTab = prev[1];
            if (secondTab) {
              return [secondTab, tab];
            }
            return [tab];
          }
          return [...prev, tab];
        }
      });
    } else {
      setActiveTab(tab);
      setSelectedTabs([tab]);
    }
  };

  // Get document icon based on file extension
  const getDocumentIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconClass = "w-5 h-5";

    switch (ext) {
      case 'pdf':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="M9 13h6M9 17h6"></path>
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <line x1="10" y1="9" x2="8" y2="9"></line>
          </svg>
        );
      case 'xls':
      case 'xlsx':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="8" y1="13" x2="16" y2="13"></line>
            <line x1="8" y1="17" x2="16" y2="17"></line>
            <line x1="12" y1="11" x2="12" y2="19"></line>
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        );
      default:
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        );
    }
  };

  // Toggle multi-select mode
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(prev => {
      if (!prev) {
        if (activeTab == 'review') {
          setSelectedTabs([activeTab, 'application'])
        }
        else {
          setSelectedTabs([activeTab, 'review']);
        }
        // Entering multi-select mode - keep current active tab
        setPdfScale(1.00)
      } else {
        // Exiting multi-select mode - set active tab to first selected
        if (selectedTabs.length > 0) {
          const firstTab = selectedTabs[0];
          if (firstTab) {
            setActiveTab(firstTab);
            setSelectedTabs([firstTab]);

          }
        }
        setPdfScale(1.40)
      }
      return !prev;
    });
  };

  // Render tab content based on tab type
  const renderTabContent = (tab: TabType) => {
    switch (tab) {
      case 'review':
        console.log('🔍 Rendering review tab');
        console.log('  - readOnlyFields:', readOnlyFields, 'keys:', Object.keys(readOnlyFields), 'length:', Object.keys(readOnlyFields).length);
        console.log('  - outputFields:', outputFields, 'keys:', Object.keys(outputFields), 'length:', Object.keys(outputFields).length);
        console.log('  - outcomes:', outcomes, 'keys:', Object.keys(outcomes), 'length:', Object.keys(outcomes).length);
        return (
          <div className="space-y-8">
            {/* Read-Only Fields Display */}
            {Object.keys(readOnlyFields).length > 0 && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-2xl">Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {Object.entries(readOnlyFields).map(([fieldName, fieldConfig]) => {
                      const value = fieldConfig.value || formData[fieldName] || 'N/A';
                      // Try to format as currency if it looks like a number
                      const displayValue = typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)
                        ? `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : value;
                      
                      return (
                        <div key={fieldName}>
                          <label className="block text-sm font-semibold text-muted-foreground mb-2">
                            {fieldConfig.label}
                          </label>
                          <div className="bg-muted px-4 py-3 rounded-lg font-medium">
                            {displayValue}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {formData.aiAgentHTML && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-bold">AI Agent Analysis</h3>
                        <svg width="28" height="28" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M23.832 15.166H22.7487C22.7487 10.9735 19.3579 7.58268 15.1654 7.58268H14.082V6.20685C14.732 5.83852 15.1654 5.13435 15.1654 4.33268C15.1654 3.14102 14.2012 2.16602 12.9987 2.16602C11.7962 2.16602 10.832 3.14102 10.832 4.33268C10.832 5.13435 11.2654 5.83852 11.9154 6.20685V7.58268H10.832C6.63953 7.58268 3.2487 10.9735 3.2487 15.166H2.16536C1.56953 15.166 1.08203 15.6535 1.08203 16.2493V19.4993C1.08203 20.0952 1.56953 20.5827 2.16536 20.5827H3.2487V21.666C3.2487 22.8685 4.2237 23.8327 5.41536 23.8327H20.582C21.7845 23.8327 22.7487 22.8685 22.7487 21.666V20.5827H23.832C24.4279 20.5827 24.9154 20.0952 24.9154 19.4993V16.2493C24.9154 15.6535 24.4279 15.166 23.832 15.166ZM22.7487 18.416H20.582V21.666H5.41536V18.416H3.2487V17.3327H5.41536V15.166C5.41536 12.176 7.84203 9.74935 10.832 9.74935H15.1654C18.1554 9.74935 20.582 12.176 20.582 15.166V17.3327H22.7487V18.416ZM9.20703 14.6243L11.7637 17.181L10.4854 18.4594L9.20703 17.181L7.9287 18.4594L6.65036 17.181L9.20703 14.6243ZM16.7904 14.6243L19.347 17.181L18.0687 18.4594L16.7904 17.181L15.512 18.4594L14.2337 17.181L16.7904 14.6243Z" fill="#273139"></path>
                        </svg>
                      </div>
                      <div className="prose prose-sm max-w-none bg-muted rounded-lg p-4" dangerouslySetInnerHTML={{ __html: formData.aiAgentHTML }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Output Fields (Review Decision) */}
            {Object.keys(outputFields).length > 0 && (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl">Review Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(outputFields).map(([fieldName, fieldConfig]) => {
                    const fieldValue = formData[fieldName] || '';
                    const isRequired = fieldConfig.required || false;
                    
                    if (fieldConfig.type === 'textarea') {
                      return (
                        <div key={fieldName}>
                          <label htmlFor={fieldName} className="block text-sm font-semibold mb-2">
                            {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')} {isRequired && '*'}
                          </label>
                          <Textarea
                            id={fieldName}
                            name={fieldName}
                            value={String(fieldValue)}
                            onChange={handleChange}
                            placeholder={`Enter ${fieldName}...`}
                            rows={5}
                            className="resize-none"
                          />
                        </div>
                      );
                    } else if (fieldConfig.type === 'number' || fieldConfig.type === 'integer') {
                      return (
                        <div key={fieldName}>
                          <label htmlFor={fieldName} className="block text-sm font-semibold mb-2">
                            {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')} {isRequired && '*'}
                          </label>
                          <input
                            id={fieldName}
                            name={fieldName}
                            type="number"
                            value={fieldValue}
                            onChange={handleChange}
                            placeholder={`Enter ${fieldName}...`}
                            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      );
                    } else {
                      // Default to string input
                      return (
                        <div key={fieldName}>
                          <label htmlFor={fieldName} className="block text-sm font-semibold mb-2">
                            {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')} {isRequired && '*'}
                          </label>
                          <input
                            id={fieldName}
                            name={fieldName}
                            type="text"
                            value={String(fieldValue)}
                            onChange={handleChange}
                            placeholder={`Enter ${fieldName}...`}
                            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      );
                    }
                  })}
                </CardContent>
              </Card>
            )}

            {/* Dynamic Action Buttons */}
            {Object.keys(outcomes).length > 0 && (
              <div className="flex gap-4">
                {Object.entries(outcomes).map(([outcomeName, outcomeConfig], index) => {
                  const isFirst = index === 0;
                  const isDestructive = outcomeName.toLowerCase().includes('reject') || 
                                       outcomeName.toLowerCase().includes('decline') ||
                                       outcomeName.toLowerCase().includes('deny');
                  
                  return (
                    <Button
                      key={outcomeName}
                      type="button"
                      onClick={() => handleOutcome(outcomeName)}
                      disabled={!isFormValid}
                      size="lg"
                      variant={isDestructive ? "destructive" : "default"}
                      className={cn(
                        "flex-1 h-14 text-lg",
                        isFirst && !isDestructive && "bg-green-400 hover:bg-green-700",
                        isDestructive && "bg-red-400"
                      )}
                    >
                      {outcomeConfig.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'applicant':
        const totalHistoryPages = Math.ceil(entityHistory.length / historyPerPage);
        const startHistoryIndex = (historyPage - 1) * historyPerPage;
        const endHistoryIndex = startHistoryIndex + historyPerPage;
        const paginatedHistory = entityHistory.slice(startHistoryIndex, endHistoryIndex);
        const entityFieldEntries = Object.entries(entityFields);

        return (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Entity History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p>Loading entity history...</p>
                </div>
              ) : entityHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted rounded-lg">No entity history available in Data Fabric</div>
              ) : entityFieldEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted rounded-lg">No entity fields configured</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {entityFieldEntries.map(([fieldName, fieldConfig]) => (
                          <TableHead key={fieldName}>{fieldConfig.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedHistory.map((record) => (
                        <TableRow key={record.id}>
                          {entityFieldEntries.map(([fieldName]) => {
                            const value = record[fieldName];
                            const displayValue = typeof value === 'number' 
                              ? value.toLocaleString() 
                              : (value || 'N/A');
                            
                            // Check if this field looks like a status field for special styling
                            const isStatusField = fieldName.toLowerCase().includes('status');
                            const statusValue = String(value || '').toLowerCase();
                            
                            return (
                              <TableCell key={fieldName} className={isStatusField ? "" : "font-medium"}>
                                {isStatusField ? (
                                  <span className={cn(
                                    "inline-block px-3 py-1 rounded-full text-xs font-medium",
                                    statusValue === 'approved' && "bg-green-100 text-green-800",
                                    statusValue === 'pending' && "bg-yellow-100 text-yellow-800",
                                    statusValue === 'rejected' && "bg-red-100 text-red-800",
                                    !['approved', 'pending', 'rejected'].includes(statusValue) && "bg-slate-100 text-slate-800"
                                  )}>
                                    {displayValue}
                                  </span>
                                ) : (
                                  displayValue
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination Controls */}
                  {totalHistoryPages > 1 && (
                    <div className="flex items-center justify-between px-2">
                      <div className="text-sm text-muted-foreground">
                        Showing {startHistoryIndex + 1}-{Math.min(endHistoryIndex, entityHistory.length)} of {entityHistory.length} records
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                          disabled={historyPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm font-medium min-w-[100px] text-center">
                          Page {historyPage} of {totalHistoryPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                          disabled={historyPage === totalHistoryPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );

      case 'application':
        // Filter documents by filePath if provided
        const filePathFilter = formData.filePath as string | undefined;
        const filteredDocuments = filePathFilter && filePathFilter.trim() !== ''
          ? availableDocuments.filter(doc => doc.filePath.includes(filePathFilter))
          : availableDocuments;
        
        const totalDocPages = Math.ceil(filteredDocuments.length / documentsPerPage);
        const startDocIndex = (documentPage - 1) * documentsPerPage;
        const endDocIndex = startDocIndex + documentsPerPage;
        const paginatedDocuments = filteredDocuments.slice(startDocIndex, endDocIndex);

        return (
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Attachments</CardTitle>
                {documentUrl && (
                  <div className="flex items-center gap-2">
                    <Button type="button" onClick={zoomOut} disabled={pdfScale <= 0.5} variant="outline" size="sm" title="Zoom out">−</Button>
                    <Button type="button" onClick={zoomIn} disabled={pdfScale >= 3.0} variant="outline" size="sm" title="Zoom in">+</Button>
                    <Button type="button" onClick={resetZoom} variant="outline" size="sm" title="Reset zoom to 100%">Reset</Button>
                    <span className="text-sm font-medium min-w-[60px] text-center text-muted-foreground">{Math.round(pdfScale * 100)}%</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Path Input */}
              <div>
                <label htmlFor="filePath" className="block text-sm font-semibold mb-2">File Path Filter (Optional)</label>
                <input
                  id="filePath"
                  name="filePath"
                  type="text"
                  value={String(formData.filePath || '')}
                  onChange={handleChange}
                  placeholder="Enter file path to filter documents (leave empty to show all)..."
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {filePathFilter && filePathFilter.trim() !== '' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Showing {filteredDocuments.length} of {availableDocuments.length} documents matching "{filePathFilter}"
                  </p>
                )}
              </div>
              {/* Collapsible Document List Grid */}
              {(isLoadingDocumentList || filteredDocuments.length > 0) && (
                <Collapsible open={isDocumentGridOpen} onOpenChange={setIsDocumentGridOpen}>
                  <div className="border rounded-lg overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full flex items-center justify-between p-4 hover:bg-muted">
                        <span className="font-semibold">Document List ({filteredDocuments.length})</span>
                        {isDocumentGridOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {isLoadingDocumentList ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                          <p>Loading document list...</p>
                        </div>
                      ) : filteredDocuments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-muted rounded-lg">
                          {filePathFilter && filePathFilter.trim() !== '' 
                            ? `No documents found matching "${filePathFilter}"`
                            : 'No documents available'}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="w-12"></TableHead>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Document Name</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Upload Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedDocuments.map((doc) => {
                                // Find the actual index in the full availableDocuments array for selection
                                const actualIndex = availableDocuments.findIndex(d => d.filePath === doc.filePath);
                                const isSelected = actualIndex >= 0 && selectedDocumentIndex === actualIndex;
                                return (
                                  <TableRow
                                    key={doc.filePath}
                                    className={cn(
                                      "cursor-pointer transition-colors",
                                      isSelected
                                        ? "bg-primary/10 hover:bg-primary/15 border-l-4 border-l-primary"
                                        : "hover:bg-muted/50"
                                    )}
                                    onClick={() => handleDocumentSelect(doc.filePath)}
                                  >
                                    <TableCell className="text-center">
                                      {isSelected && <div className="w-2 h-2 rounded-full bg-primary mx-auto"></div>}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {getDocumentIcon(doc.name)}
                                    </TableCell>
                                    <TableCell className="font-medium">{doc.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{doc.size || 'N/A'}</TableCell>
                                    <TableCell className="text-muted-foreground">{doc.uploadDate || 'N/A'}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>

                          {/* Pagination Controls */}
                          {totalDocPages > 1 && (
                            <div className="flex items-center justify-between px-2 pb-2">
                              <div className="text-sm text-muted-foreground">
                                Showing {startDocIndex + 1}-{Math.min(endDocIndex, filteredDocuments.length)} of {filteredDocuments.length} documents
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDocumentPage(prev => Math.max(1, prev - 1))}
                                  disabled={documentPage === 1}
                                >
                                  Previous
                                </Button>
                                <span className="text-sm font-medium min-w-[100px] text-center">
                                  Page {documentPage} of {totalDocPages}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDocumentPage(prev => Math.min(totalDocPages, prev + 1))}
                                  disabled={documentPage === totalDocPages}
                                >
                                  Next
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}

              <div className="bg-muted rounded-lg p-4 border overflow-auto max-h-[600px]">
                {isLoadingDocument ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p>Loading document...</p>
                  </div>
                ) : documentUrl ? (
                  <div className="flex justify-center">
                    <Document file={documentUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="text-center py-8 text-muted-foreground">Loading PDF...</div>}>
                      <Page pageNumber={pageNumber} scale={pdfScale} renderTextLayer={true} renderAnnotationLayer={true} />
                    </Document>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">No document available</div>
                )}
              </div>

              {numPages && (
                <div className="flex items-center justify-center gap-4 p-3 bg-muted rounded-lg">
                  <Button type="button" onClick={goToPrevPage} disabled={pageNumber <= 1} variant="default" size="sm" title="Previous page">Previous</Button>
                  <span className="text-sm font-medium min-w-[120px] text-center">Page {pageNumber} of {numPages}</span>
                  <Button type="button" onClick={goToNextPage} disabled={pageNumber >= numPages} variant="default" size="sm" title="Next page">Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
    }
  };

  // ============================================================================
  // FORM VALIDATION
  // ============================================================================
  // Check if the form is valid before allowing submission
  // All required output fields must be filled
  const isFormValid = Object.entries(outputFields).every(([fieldName, fieldConfig]) => {
    if (fieldConfig.required) {
      const value = formData[fieldName];
      return value !== undefined && value !== null && value !== '';
    }
    return true;
  });

  // ============================================================================
  // JSX RENDER (What displays on screen)
  // ============================================================================
  // Everything below this "return" statement is JSX - it looks like HTML but is
  // actually JavaScript that describes what the UI should look like.
  // When state changes, React automatically re-renders this JSX with new data.
  return (
    <form className="min-h-screen py-8 px-4" onSubmit={handleSubmit}>
      {/* Header Section - Constrained */}
      <div className="max-w-5xl mx-auto">
        <Card className="mb-6 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-4xl mb-2">
                  Loan Application Review
                </CardTitle>
                <CardDescription className="text-lg">
                  Review and approve loan applications
                </CardDescription>
              </div>
              <div className="flex-shrink-0">
                <img src={resolveAssetUrl(companyLogo)} alt="UiPath Logo" className="h-10" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Multi-select Toggle */}
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleMultiSelectMode}
          >
            {isMultiSelectMode ? 'Single View' : 'Split View'}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation - Constrained in single view, full width in multi-view */}
      {!isMultiSelectMode ? (
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="mb-6">
            <TabsList className="w-full grid grid-cols-3 h-auto p-1 mb-6">
              <TabsTrigger value="review" className="px-8 py-4 text-base">
                Review Application
              </TabsTrigger>
              <TabsTrigger value="applicant" className="px-8 py-4 text-base">
                Applicant History
              </TabsTrigger>
              <TabsTrigger value="application" className="px-8 py-4 text-base">
                Attachments
              </TabsTrigger>
            </TabsList>

            <div>
              {/* Tab 1: Review Application */}
              <TabsContent value="review" className="mt-0">
                {renderTabContent('review')}
              </TabsContent>

              {/* Tab 2: Applicant History */}
              <TabsContent value="applicant" className="mt-0">
                {renderTabContent('applicant')}
              </TabsContent>

              {/* Tab 3: Attachments */}
              <TabsContent value="application" className="mt-0">
                {renderTabContent('application')}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      ) : (
        /* Multi-Select Tab View - Full Width */
        <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto mb-6">
          {/* Tab Selection - Same Style as Single View */}
          <div className="w-full grid grid-cols-3 h-auto p-1 mb-6 rounded-lg bg-muted">
            <button
              type="button"
              className={cn(
                "px-8 py-4 text-base font-semibold inline-flex items-center justify-center whitespace-nowrap rounded-md ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                selectedTabs.includes('review')
                  ? "!bg-background !text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleTabToggle('review')}
            >
              Review Application
            </button>
            <button
              type="button"
              className={cn(
                "px-8 py-4 text-base font-semibold inline-flex items-center justify-center whitespace-nowrap rounded-md ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                selectedTabs.includes('applicant')
                  ? "!bg-background !text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleTabToggle('applicant')}
            >
              Applicant History
            </button>
            <button
              type="button"
              className={cn(
                "px-8 py-4 text-base font-semibold inline-flex items-center justify-center whitespace-nowrap rounded-md ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                selectedTabs.includes('application')
                  ? "!bg-background !text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleTabToggle('application')}
            >
              Attachments
            </button>
          </div>

          {/* Responsive Grid Layout for Selected Tabs - Full Width */}
          <div className={cn(
            "grid gap-6",
            selectedTabs.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
          )}>
            {selectedTabs.map((tab) => (
              <div key={tab} className="min-w-0">
                {renderTabContent(tab)}
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
};

export default Form;
