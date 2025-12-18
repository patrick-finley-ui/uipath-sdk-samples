import { useEffect, useState } from 'react';
import sdk, { initializeSdk } from './uipath';
import InvoiceForm from './components/LoanForm';
import { resolveAssetUrl } from './utils/assetUtils';
import './App.css';

interface LineItem {
  line_item: string;
  po_shipment_number: string;
  po_delivery_estimate_date: string;
  shipment_number_goods_receipt: string;
  delivery_date_goods_receipt: string;
  line_item_po: string;
  line_item_invoice: string;
  line_item_goods_receipt: string;
  quantity_po: string;
  quantity_invoice: string;
  quantity_shipped_goods_receipt: string;
  quantity_accepted_goods_receipt: string;
  quantity_rejected_goods_receipt: string;
  unit_price_po: string;
  unit_price_invoice: string;
  unit_price_goods_receipt: string;
  amount_po: string;
  amount_invoice: string;
  amount_goods_receipt: string;
  acceptance_condition_goods_receipt: string;
  acceptance_remarks_goods_receipt: string;
  funding_code_po: string;
  match_status: string;
  notes: string;
}

interface KeyDetails {
  contract_number_purchase_order: string;
  contract_number_invoice: string;
  contract_number_goods_receipt: string;
  invoice_number_invoice: string;
  invoice_number_goods_receipt: string;
  vendor_invoice: string;
  vendor_goods_receipt: string;
  vendor_purchase_order: string;
  currency_po: string;
  currency_invoice: string;
  currency_goods_receipt: string;
  total_amount_po: string;
  total_amount_invoice: string;
  total_amount_goods_receipt: string;
  acceptance_date: string;
  invoice_date: string;
  shipment_reference: string;
  delivery_point: string;
  rejection_reason: string[];
  missingGoodsReceipt: string;
  verification_summary: string;
}

interface InvoiceFormData {
  clins: LineItem[];
  key_details: KeyDetails;
  reviewerComments: string;
}

function App() {
  const [formData, setFormData] = useState<InvoiceFormData>({
    clins: [],
    key_details: {
      contract_number_purchase_order: '',
      contract_number_invoice: '',
      contract_number_goods_receipt: '',
      invoice_number_invoice: '',
      invoice_number_goods_receipt: '',
      vendor_invoice: '',
      vendor_goods_receipt: '',
      vendor_purchase_order: '',
      currency_po: '',
      currency_invoice: '',
      currency_goods_receipt: '',
      total_amount_po: '',
      total_amount_invoice: '',
      total_amount_goods_receipt: '',
      acceptance_date: '',
      invoice_date: '',
      shipment_reference: '',
      delivery_point: '',
      rejection_reason: [],
      missingGoodsReceipt: '',
      verification_summary: '',
    },
    reviewerComments: '',
  });

  useEffect(() => {
    sdk.taskEvents.getTaskDetailsFromActionCenter((data: any) => {
      if (data.data) {
        setFormData(data.data);
      }
      if (data.baseUrl && data.orgName && data.tenantName && data.token) {
        initializeSdk({
          baseUrl: data.baseUrl,
          orgName: data.orgName,
          tenantName: data.tenantName,
          token: data.token
        });
      }
      if (data.newToken) {
        sdk.updateToken(data.newToken);
      }
    });
    sdk.taskEvents.initializeInActionCenter();
  }, []);

  const handleDataChange = (newData: InvoiceFormData) => {
    setFormData(newData);
    sdk.taskEvents.dataChanged(newData);
  };

  const handleProcess = () => {
    sdk.taskEvents.completeTask('Process', formData);
  };

  const handleReject = () => {
    sdk.taskEvents.completeTask('Reject', formData);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <img
          src={resolveAssetUrl('/src/assets/react.svg')}
          className="logo"
          alt="logo"
        />
        <h1>Invoice Three-Way Match Review</h1>
      </header>
      <main>
        <InvoiceForm
          data={formData}
          onDataChange={handleDataChange}
          onProcess={handleProcess}
          onReject={handleReject}
        />
      </main>
    </div>
  );
}

export default App;
