import React, { useState } from 'react';
import { resolveAssetUrl } from '../utils/assetUtils';
import './LoanForm.css';

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

interface InvoiceFormProps {
  data: InvoiceFormData;
  onDataChange: (data: InvoiceFormData) => void;
  onProcess: () => void;
  onReject: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ data, onDataChange, onProcess, onReject }) => {
  const [activeTab, setActiveTab] = useState<'review' | 'attachments'>('review');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onDataChange({
      ...data,
      [name]: value,
    });
  };

  return (
    <div className="loan-form-container">
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          Invoice Review
        </button>
        <button
          className={`tab-button ${activeTab === 'attachments' ? 'active' : ''}`}
          onClick={() => setActiveTab('attachments')}
        >
          Attachments
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'review' && (
          <div className="review-tab">
            <div className="summary-section">
              <h3>Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <label>Contract Number</label>
                  <div className="summary-value">{data.key_details?.contract_number_invoice || 'N/A'}</div>
                </div>
                <div className="summary-item">
                  <label>Invoice Number</label>
                  <div className="summary-value">{data.key_details?.invoice_number_invoice || 'N/A'}</div>
                </div>
                <div className="summary-item">
                  <label>Vendor</label>
                  <div className="summary-value">{data.key_details?.vendor_invoice || 'N/A'}</div>
                </div>
                <div className="summary-item">
                  <label>Invoice Date</label>
                  <div className="summary-value">{data.key_details?.invoice_date || 'N/A'}</div>
                </div>
                <div className="summary-item">
                  <label>Total Amount (PO)</label>
                  <div className="summary-value">{data.key_details?.total_amount_po || 'N/A'}</div>
                </div>
                <div className="summary-item">
                  <label>Total Amount (Invoice)</label>
                  <div className="summary-value">{data.key_details?.total_amount_invoice || 'N/A'}</div>
                </div>
                <div className="summary-item">
                  <label>Total Amount (Goods Receipt)</label>
                  <div className="summary-value">{data.key_details?.total_amount_goods_receipt || 'N/A'}</div>
                </div>
                <div className="summary-item full-width">
                  <label>Verification Summary</label>
                  <div className="summary-value">{data.key_details?.verification_summary || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div className="line-items-section">
              <h3>Line Items</h3>
              <div className="table-container">
                <table className="line-items-table">
                  <thead>
                    <tr>
                      <th>Line</th>
                      <th>Description</th>
                      <th>Qty (PO)</th>
                      <th>Qty (Invoice)</th>
                      <th>Qty (GR)</th>
                      <th>Unit Price</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.clins?.map((item, index) => (
                      <tr key={index}>
                        <td>{item.line_item}</td>
                        <td className="description-cell">{item.line_item_po}</td>
                        <td>{item.quantity_po}</td>
                        <td>{item.quantity_invoice}</td>
                        <td>{item.quantity_accepted_goods_receipt}</td>
                        <td>{item.unit_price_po}</td>
                        <td>{item.amount_po}</td>
                        <td>
                          <span className={`status-badge ${item.match_status === 'Matched' ? 'matched' : 'unmatched'}`}>
                            {item.match_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="form-group">
              <label>Reviewer Comments</label>
              <textarea
                name="reviewerComments"
                value={data.reviewerComments || ''}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Enter your review comments here..."
              />
            </div>
            <div className="actions">
              <button onClick={onProcess} className="action-button approve">Process Invoice</button>
              <button onClick={onReject} className="action-button reject">Reject Invoice</button>
            </div>
          </div>
        )}

        {activeTab === 'attachments' && (
          <div className="attachments-tab">
            <img
              src={resolveAssetUrl('/src/assets/loanApplication.png')}
              alt="Invoice Document"
              className="attachment-image"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceForm;
