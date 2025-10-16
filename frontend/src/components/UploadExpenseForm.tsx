// ...existing code...
import React, { useState } from 'react';

interface Props {
    expenseId: string;
    onSuccess?: () => void;
}

export default function UploadExpenseForm({ expenseId, onSuccess }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(null);
        setError(null);
        setFile(e.target.files?.[0] ?? null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please choose a file first.');
            return;
        }

        setUploading(true);
        setMessage(null);
        setError(null);

        try {
            // 1) Request a signed upload URL from your backend
            const signRes = await fetch('/api/upload/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ filename: file.name, type: file.type }),
            });
            if (!signRes.ok) {
                const text = await signRes.text().catch(() => signRes.statusText);
                throw new Error(`Failed to get upload URL: ${text}`);
            }
            const { uploadUrl, key } = await signRes.json();

            // 2) Upload the file directly to storage using the signed URL
            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });
            if (!uploadRes.ok) {
                const text = await uploadRes.text().catch(() => uploadRes.statusText);
                throw new Error(`File upload failed: ${text}`);
            }

            // 3) Tell your API the new file key for the expense
            const updateRes = await fetch(`/api/expenses/${encodeURIComponent(expenseId)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ fileKey: key }),
            });
            if (!updateRes.ok) {
                const text = await updateRes.text().catch(() => updateRes.statusText);
                throw new Error(`Failed to update expense with file key: ${text}`);
            }

            setMessage('Upload successful');
            setFile(null);

            // notify parent so it can refetch / invalidate query
            onSuccess?.();
        } catch (err: any) {
            console.error(err);
            setMessage(null);
            setError(err?.message ?? 'Upload error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>
                    Receipt file
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={onFileChange}
                        disabled={uploading}
                        aria-disabled={uploading}
                    />
                </label>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={!file || uploading}
                    aria-busy={uploading}
                    aria-disabled={!file || uploading}
                >
                    {uploading ? 'Uploading…' : 'Upload'}
                </button>
            </div>

            {message && <p role="status" style={{ color: 'green' }}>{message}</p>}
            {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
        </form>
    );
}
// ...existing code...