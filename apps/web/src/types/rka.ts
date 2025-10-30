export interface RkaDocument {
  _id: string;
  _creationTime: number;
  documentNumber: string;
  title: string;
  description?: string;
  fiscalYear: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  totalBudget: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

export interface RkaDocumentInput {
  title: string;
  description?: string;
  fiscalYear: string;
  totalBudget: number;
}

export interface RkaSearchFilters {
  searchQuery?: string;
  status?: string;
  fiscalYear?: string;
  createdBy?: string;
}

export interface RkaPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export interface RkaListResult {
  documents: RkaDocument[];
  pagination: RkaPagination;
}
