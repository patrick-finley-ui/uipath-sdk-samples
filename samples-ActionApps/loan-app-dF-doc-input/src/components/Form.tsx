import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import sdk, { initializeSdk } from '../uipath';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './FormStyles.css';
import { resolveAssetUrl } from './utils';
import companyLogo from '../assets/uipath-corporate-logo-digital-rgb-ob.png';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface FormData {
  applicantName: string;
  loanAmount: string;
  creditScore: string;
  riskFactor: string;
  reviewerComments: string;
  loanDocumentStorageBucket: string;
  loanBucketStorageId: number;
  aiAgentHTML?: string;  // Optional AI-generated HTML content
}

interface LoanHistory {
  id: number;
  loanType: string;
  amount: number;
  processingDate: string;
  status: string;
  duration: string;
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

  // Store all the form field values entered by the user
  const [formData, setFormData] = useState<FormData>({
    applicantName: '',
    loanAmount: '',
    creditScore: '',
    riskFactor: '',
    reviewerComments: '',
    loanDocumentStorageBucket: '',
    loanBucketStorageId: 0
  });

  // Store loan history data fetched from UiPath Data Fabric
  const [loanHistory, setLoanHistory] = useState<LoanHistory[]>([]);
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

  // Store data received from UiPath Action Center (org info, auth tokens, etc.)
  const [actionCenterData, setActionCenterData] = useState<any>(null);

  // ============================================================================
  // LIFECYCLE HOOK: Initialize from Action Center
  // ============================================================================
  // useEffect runs code when the component first loads or when dependencies change.
  // This one runs ONCE when the form first loads (empty [] means no dependencies).
  // It receives initial data from UiPath Action Center and sets up authentication.
  useEffect(() => {
    // Register a callback to receive task data from Action Center
    sdk.taskEvents.getTaskDetailsFromActionCenter((data: any) => {
      // Populate form fields from Action Center task data
      if (data.data) {
        const processedData = {
          ...data.data,
          // Ensure loanBucketStorageId is stored as a number (convert from string if needed)
          loanBucketStorageId: typeof data.data.loanBucketStorageId === 'string'
            ? parseInt(data.data.loanBucketStorageId, 10)
            : data.data.loanBucketStorageId || 0
        };
        setFormData(processedData);
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
    });

    // Initialize the task event system in Action Center
    sdk.taskEvents.initializeInActionCenter();
  }, []); // Empty array = run only once when component mounts

  // ============================================================================
  // LIFECYCLE HOOK: Load Loan History from Data Fabric (API Call)
  // ============================================================================
  // This useEffect runs whenever the user switches tabs. It loads loan history
  // data from UiPath Data Fabric when the "Applicant History" tab is clicked.
  // It only loads once per session to avoid unnecessary API calls.
  useEffect(() => {
    // Only load if: user is on applicant tab AND data hasn't been loaded yet
    if (activeTab === 'applicant' && !hasLoadedHistory && !isLoadingHistory) {
      const loadLoanHistory = async () => {
        try {
          setIsLoadingHistory(true); // Show loading spinner

          // API CALL: Fetch loan records from UiPath Data Fabric
          // The entity ID 'f5cc0fa5-54dc-f011-8196-00224882fdd3' is the Data Fabric entity
          const response = await sdk.entities.getRecordsById('f5cc0fa5-54dc-f011-8196-00224882fdd3', {
            pageSize: 5,           // Get up to 5 records
            expansionLevel: 1      // Include related data
          });
          console.log('Loan history response:', response);

          // Transform the API response data into the format our UI expects
          if (response && response.items) {
            const mappedHistory = response.items.map((record: any, index: number) => ({
              id: index + 1,
              loanType: record.loanType || record.LoanType || 'N/A',
              amount: record.amount || record.Amount || 0,
              processingDate: record.processingDate || record.Date || new Date().toISOString(),
              status: record.status || record.Status || 'Unknown',
              duration: record.duration || record.Duration || 'N/A'
            }));
            setLoanHistory(mappedHistory); // Update state with fetched data
          }
          setHasLoadedHistory(true); // Mark as loaded so we don't load again
        } catch (error) {
          console.error('Error loading loan history:', error);
          setLoanHistory([]); // Set empty array on error
          setHasLoadedHistory(true);
        } finally {
          setIsLoadingHistory(false); // Hide loading spinner
        }
      };

      loadLoanHistory(); // Execute the async function
    }
  }, [activeTab, hasLoadedHistory, isLoadingHistory]); // Run when these values change

  // ============================================================================
  // LIFECYCLE HOOK: Load Document List from Orchestrator Bucket (API Call)
  // ============================================================================
  // This useEffect runs when the user switches to the "Attachments" tab.
  // It fetches the list of available documents from the UiPath Orchestrator Bucket.
  useEffect(() => {
    // Only load if: user is on attachments tab AND we haven't loaded the list yet
    if (activeTab === 'application' && !isLoadingDocumentList && availableDocuments.length === 0 && formData.loanBucketStorageId && actionCenterData?.organizationUnitId) {
      const loadDocumentList = async () => {
        try {
          setIsLoadingDocumentList(true);
          console.log('Fetching document list from bucket:', formData.loanBucketStorageId);

          // Fetch all files from the bucket using getFileMetaData API
          const fileMetaData = await sdk.buckets.getFileMetaData(
            formData.loanBucketStorageId,
            actionCenterData.organizationUnitId
          );

          console.log('File metadata response:', fileMetaData);

          // Transform the response to DocumentAttachment format
          // The API returns NonPaginatedResponse, access items property
          const blobItems = (fileMetaData as any).items || (fileMetaData as any).blobItems || [];
          const documents: DocumentAttachment[] = blobItems.map((item: any) => {
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
  }, [activeTab, isLoadingDocumentList, availableDocuments.length, formData.loanBucketStorageId, actionCenterData]);

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

  // Handle Select component changes
  const handleSelectChange = (value: string) => {
    const updatedData = {
      ...formData,
      riskFactor: value
    }
    setFormData(updatedData);
    sdk.taskEvents.dataChanged(updatedData);
  };

  // Handle form submission (prevent page reload)
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default browser form submission behavior
  };

  // Handle "Accept" button click
  const handleAccept = () => {
    console.log('Form accepted:', formData);
    // Complete the task in Action Center with "Accept" outcome and send form data
    sdk.taskEvents.completeTask('Accept', formData);
  };

  // Handle "Reject" button click
  const handleReject = () => {
    console.log('Form rejected:', formData);
    // Complete the task in Action Center with "Reject" outcome and send form data
    sdk.taskEvents.completeTask('Reject', formData);
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

      const readUri = await sdk.buckets.getReadUri({
        bucketId: formData.loanBucketStorageId,
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
  const handleDocumentSelect = async (docIndex: number) => {
    if (docIndex >= availableDocuments.length) return;

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
        
      } else {
        // Exiting multi-select mode - set active tab to first selected
        if (selectedTabs.length > 0) {
          const firstTab = selectedTabs[0];
          if (firstTab) {
            setActiveTab(firstTab);
            setSelectedTabs([firstTab]);
          }
        }
      }
      return !prev;
    });
  };

  // Render tab content based on tab type
  const renderTabContent = (tab: TabType) => {
    switch (tab) {
      case 'review':
        return (
          <div className="space-y-8">
            {/* Application Details */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Application Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">
                      Applicant Name
                    </label>
                    <div className="bg-muted px-4 py-3 rounded-lg font-medium">
                      {formData.applicantName || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">
                      Loan Amount
                    </label>
                    <div className="bg-muted px-4 py-3 rounded-lg font-medium">
                      {formData.loanAmount ? `$${parseFloat(formData.loanAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">
                      Credit Score
                    </label>
                    <div className="bg-muted px-4 py-3 rounded-lg font-medium">
                      {formData.creditScore || 'N/A'}
                    </div>
                  </div>
                </div>
                {formData.aiAgentHTML && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-bold mb-4">AI Agent Analysis</h3>
                    <div className="prose prose-sm max-w-none bg-muted rounded-lg p-4" dangerouslySetInnerHTML={{ __html: formData.aiAgentHTML }} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review Decision */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl">Review Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label htmlFor="riskFactor" className="block text-sm font-semibold mb-2">Risk Assessment *</label>
                  <Select value={formData.riskFactor} onValueChange={handleSelectChange}>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Select Risk Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Low Risk - Excellent credit, stable income</SelectItem>
                      <SelectItem value="2">Medium-Low Risk - Good credit, minor concerns</SelectItem>
                      <SelectItem value="3">Medium Risk - Average credit, some uncertainties</SelectItem>
                      <SelectItem value="4">Medium-High Risk - Below average credit, notable concerns</SelectItem>
                      <SelectItem value="5">High Risk - Poor credit, significant red flags</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="reviewerComments" className="block text-sm font-semibold mb-2">Review Comments</label>
                  <Textarea id="reviewerComments" name="reviewerComments" value={formData.reviewerComments} onChange={handleChange} placeholder="Enter your review comments and justification for the decision..." rows={5} className="resize-none" />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button type="button" onClick={handleAccept} disabled={!isFormValid} size="lg" className="flex-1 h-14 text-lg bg-green-400 hover:bg-green-700">Accept Application</Button>
              <Button type="button" onClick={handleReject} disabled={!isFormValid} variant="destructive" size="lg" className="flex-1 h-14 text-lg bg-red-400">Reject Application</Button>
            </div>
          </div>
        );

      case 'applicant':
        return (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Loan History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p>Loading loan history...</p>
                </div>
              ) : loanHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted rounded-lg">No loan history available in Data Fabric</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Processing Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loanHistory.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.loanType}</TableCell>
                        <TableCell>{loan.amount.toLocaleString()}</TableCell>
                        <TableCell>{loan.processingDate}</TableCell>
                        <TableCell>{loan.duration}</TableCell>
                        <TableCell>
                          <span className={cn("inline-block px-3 py-1 rounded-full text-xs font-medium", loan.status.toLowerCase() === 'approved' && "bg-green-100 text-green-800", loan.status.toLowerCase() === 'pending' && "bg-yellow-100 text-yellow-800", loan.status.toLowerCase() === 'rejected' && "bg-red-100 text-red-800", !['approved', 'pending', 'rejected'].includes(loan.status.toLowerCase()) && "bg-slate-100 text-slate-800")}>
                            {loan.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );

      case 'application':
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
              {/* Collapsible Document List Grid */}
              {(isLoadingDocumentList || availableDocuments.length > 0) && (
                <Collapsible open={isDocumentGridOpen} onOpenChange={setIsDocumentGridOpen}>
                  <div className="border rounded-lg overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full flex items-center justify-between p-4 hover:bg-muted">
                        <span className="font-semibold">Document List ({availableDocuments.length})</span>
                        {isDocumentGridOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {isLoadingDocumentList ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                          <p>Loading document list...</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-12"></TableHead>
                              <TableHead>Document Name</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>Upload Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {availableDocuments.map((doc, index) => (
                              <TableRow key={index} className={cn("cursor-pointer transition-colors", selectedDocumentIndex === index ? "bg-primary/10 hover:bg-primary/15 border-l-4 border-l-primary" : "hover:bg-muted/50")} onClick={() => handleDocumentSelect(index)}>
                                <TableCell className="text-center">
                                  {selectedDocumentIndex === index && <div className="w-2 h-2 rounded-full bg-primary mx-auto"></div>}
                                </TableCell>
                                <TableCell className="font-medium">{doc.name}</TableCell>
                                <TableCell className="text-muted-foreground">{doc.size || 'N/A'}</TableCell>
                                <TableCell className="text-muted-foreground">{doc.uploadDate || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
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
  // Risk Factor is required, so buttons are disabled until it's filled
  const isFormValid = formData.riskFactor && formData.riskFactor !== '';

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
            {isMultiSelectMode ? 'Single View' : 'Multi-View (Max 2)'}
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
                  ? "bg-background text-foreground shadow"
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
                  ? "bg-background text-foreground shadow"
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
                  ? "bg-background text-foreground shadow"
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
