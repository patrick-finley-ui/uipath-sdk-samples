export interface Claim {
  id: string;
  claimId: string;
  policyNumber: string;
  claimantName: string;
  claimantContactInformation: string;
  dateOfLoss: string;
  dateReported: string;
  invoiceNumber: string;
  totalClaimedAmount: number;
  maestroInstanceId: string;
  folderId: string;
  dateCreated: string;
  createdBy: string;
  updatedBy: string;
  recordOwner: string;
  updateTime: string;
  createTime: string;
}
