import type { InvoiceRecord, ScriptResponseData } from '../../types/invoices';
import { formatNameFromEmail } from '../../utils/formatters';

interface KeyDetailsCardProps {
  scriptResponse: ScriptResponseData;
  selectedInvoice: InvoiceRecord;
}

export const KeyDetailsCard = ({ scriptResponse, selectedInvoice }: KeyDetailsCardProps) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
        Key Details
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Contract Number */}
        {(() => {
          const contractNumber =
            scriptResponse.summaryData?.ContractNumber ||
            scriptResponse.keyDetails?.contract_number_invoice ||
            scriptResponse.keyDetails?.contract_number_purchase_order;
          return contractNumber ? (
            <div>
              <span className="text-base text-gray-500 block mb-1">Contract Number</span>
              <span className="text-lg font-semibold text-gray-900 font-mono block">{contractNumber}</span>
            </div>
          ) : null;
        })()}

        {/* Invoice Number */}
        {(() => {
          const invoiceNumber =
            scriptResponse.summaryData?.InvoiceNumber ||
            scriptResponse.keyDetails?.invoice_number_invoice ||
            selectedInvoice.invoiceId;
          return invoiceNumber ? (
            <div>
              <span className="text-base text-gray-500 block mb-1">Invoice Number</span>
              <span className="text-lg font-semibold text-gray-900 font-mono block">{invoiceNumber}</span>
            </div>
          ) : null;
        })()}

        {/* Invoice Date */}
        {(() => {
          const invoiceDate =
            scriptResponse.keyDetails?.invoice_date ||
            scriptResponse.summaryData?.Timestamp ||
            selectedInvoice.createdBy;
          return invoiceDate ? (
            <div>
              <span className="text-base text-gray-500 block mb-1">Invoice Date</span>
              <span className="text-lg font-semibold text-gray-900 block">
                {new Date(invoiceDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          ) : null;
        })()}

        {/* Number of CLINs */}
        {scriptResponse.clinsData && (
          <div>
            <span className="text-base text-gray-500 block mb-1">Number of CLINs</span>
            <span className="text-lg font-semibold text-gray-900 block">{scriptResponse.clinsData.length}</span>
          </div>
        )}

        {/* Total Amount */}
        {(() => {
          let totalAmount =
            scriptResponse.keyDetails?.total_amount_invoice || scriptResponse.summaryData?.TotalAmount;

          // If not found, sum up clinsData amounts
          if (!totalAmount && scriptResponse.clinsData) {
            totalAmount = scriptResponse.clinsData.reduce((sum: number, clin: any) => {
              const amount = parseFloat(clin.amount_invoice || clin.amount || 0);
              return sum + amount;
            }, 0);
          }

          return totalAmount ? (
            <div>
              <span className="text-base text-gray-500 block mb-1">Total Amount (Invoice)</span>
              <span className="text-lg font-semibold text-gray-900 block">
                ${Number(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ) : null;
        })()}

        {/* Payment Date */}
        {(() => {
          let paymentDate =
            scriptResponse.keyDetails?.payment_date || scriptResponse.keyDetails?.paymentDueDate;

          if (!paymentDate) {
            // If the first two fields are empty, use 30 days from now
            paymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          } else if (!paymentDate) {
            paymentDate =
              (selectedInvoice as any).payment_date ||
              (selectedInvoice as any).payment_due ||
              scriptResponse.keyDetails?.settlement_date;
          }
          return (
            <div>
              <span className="text-base text-gray-500 block mb-1">Payment Date</span>
              <span className="text-lg font-semibold text-gray-900 block">
                {paymentDate
                  ? new Date(paymentDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </span>
            </div>
          );
        })()}
        
 
        {/* Shipment Number */}
        {(() => {
          const shipmentNumber =
            scriptResponse.keyDetails?.shipment_reference ||
            (scriptResponse.clinsData && scriptResponse.clinsData[0]?.po_shipment_number) ||
            (scriptResponse.clinsData && scriptResponse.clinsData[0]?.shipment_number_goods_receipt);
          return (
            <div>
              <span className="text-base text-gray-500 block mb-1">Shipment Number</span>
              <span className="text-lg font-semibold text-gray-900 block">{shipmentNumber || 'N/A'}</span>
            </div>
          );
        })()}

        {/* Vendor Contact */}
        {selectedInvoice.userEmail ? (
          <div>
            <span className="text-base text-gray-500 block mb-1">Vendor Contact</span>
            <div className="relative group inline-block">
              <span className="cursor-help text-lg font-semibold text-gray-900 block">
                {formatNameFromEmail(selectedInvoice.userEmail).fullName || '-'}
              </span>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 pointer-events-none">
                {selectedInvoice.userEmail}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        

 
   
        {/* Ship Address */}
        {(() => {
          const shipAddress = scriptResponse.keyDetails?.delivery_point || '123 Main Street, Washington, DC 20001';
          return (
            <div className="col-span-2">
              <span className="text-base text-gray-500 block mb-1">Ship Address</span>
              <span className="text-lg font-semibold text-gray-900 block">{shipAddress}</span>
            </div>
          );
        })()}
        
      </div>
    </div>
  );
};
