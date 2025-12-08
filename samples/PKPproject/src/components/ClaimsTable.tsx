import { Claim } from '@/types/claims';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';

interface ClaimsTableProps {
  claims: Claim[];
}

export const ClaimsTable = ({ claims }: ClaimsTableProps) => {
  if (claims.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No claims found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-green-500">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-b">
              Claim ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-b">
              Policy Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-b">
              Claimant Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-b">
              Contact Info
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-b">
              Date of Loss
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-b">
              Date Reported
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-b">
              Invoice Number
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-b">
              Claimed Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-b">
              Created
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-b">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {claims.map((claim) => (
            <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-900">{claim.claimId}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{claim.policyNumber}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{claim.claimantName}</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {claim.claimantContactInformation}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {formatDate(claim.dateOfLoss)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {formatDate(claim.dateReported)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">{claim.invoiceNumber}</td>
              <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                {formatCurrency(claim.totalClaimedAmount)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatDateTime(claim.dateCreated)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatDateTime(claim.updateTime)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
