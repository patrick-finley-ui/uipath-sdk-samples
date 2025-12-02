export const formatCurrency = (amount?: number): string => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
};

export const formatDateShort = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
};

export const getStatusColor = (status?: string): string => {
  if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';

  switch (status.toLowerCase()) {
    case 'approved':
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending review':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'under review':
    case 'processing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const formatInvoiceIdWithTimestamp = (invoiceId?: string, createTime?: string): string => {
  if (!invoiceId) return '-';

  if (!createTime) {
    return invoiceId;
  }

  try {
    const date = new Date(createTime);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const timestamp = `${month}${day}${hours}${minutes}`;
    return `${invoiceId}-${timestamp}`;
  } catch {
    return invoiceId;
  }
};



  // Parse email to extract and format name
  export const formatNameFromEmail = (email: string | undefined): { firstName: string; lastName: string; fullName: string } => {
    if (!email) {
      return { firstName: '-', lastName: '', fullName: '-' };
    }

    // Extract the part before @ symbol
    const namePart = email.split('@')[0];

    // Split by common delimiters (dot, underscore, dash)
    const nameParts = namePart.split(/[._-]/);

    // Capitalize first letter of each part
    const capitalize = (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    if (nameParts.length >= 2) {
      const firstName = capitalize(nameParts[0]);
      const lastName = capitalize(nameParts[nameParts.length - 1]);
      return { firstName, lastName, fullName: `${firstName} ${lastName}` };
    } else if (nameParts.length === 1) {
      const firstName = capitalize(nameParts[0]);
      return { firstName, lastName: '', fullName: firstName };
    }

    return { firstName: email, lastName: '', fullName: email };
  };