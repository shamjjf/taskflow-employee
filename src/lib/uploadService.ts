import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface UploadedFile {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export const uploadService = {
  async uploadFile(file: File): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const response = await axios.post(`${API_URL}/uploads`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    return response.data.data;
  },

  // Convert relative URL (/uploads/abc.png) to absolute URL for display
  getFullUrl(fileUrl: string): string {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(
      /\/api\/?$/,
      ''
    );
    return `${baseUrl}${fileUrl}`;
  },
};
