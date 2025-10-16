import React, { useEffect, useState } from 'react';

interface Props {
    expenseId: string;
    onSuccess?: () => void;
}

export default function UploadExpenseForm({ expenseId, onSuccess }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!file || !file.type.startsWith('image/')) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

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

            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });
            if (!uploadRes.ok) {
                const text = await uploadRes.text().catch(() => uploadRes.statusText);
                throw new Error(`File upload failed: ${text}`);
            }

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
            setError(null);
            onSuccess?.();
        } catch (err: any) {
            // log raw error but show a neutral message to the user
            console.error("Upload error:", err);
            setMessage(null);
            setError('Could not upload receipt. Try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-3">
                <label
                    className="inline-flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 bg-white hover:bg-gray-50 text-sm shadow-sm"
                >
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 21H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm text-gray-700">{file ? 'Change file' : 'Choose receipt'}</span>
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={onFileChange}
                        disabled={uploading}
                        aria-disabled={uploading}
                        className="sr-only"
                    />
                </label>

                <div className="flex-1 min-w-0">
                    {file ? (
                        <div className="flex items-center gap-3">
                            {previewUrl ? (
                                <img src={previewUrl} alt="preview" className="w-12 h-12 object-cover rounded-md border" />
                            ) : (
                                <div className="w-12 h-12 flex items-center justify-center rounded-md bg-gray-100 text-sm text-gray-600 border">
                                    {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                                </div>
                            )}
                            <div className="truncate text-sm">
                                <div className="font-medium">{file.name}</div>
                                <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">No file selected</div>
                    )}
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={!file || uploading}
                    aria-busy={uploading}
                    aria-disabled={!file || uploading}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm shadow-sm disabled:opacity-60"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{uploading ? 'Uploading…' : 'Upload receipt'}</span>
                </button>
            </div>

            {message && <p role="status" className="text-sm text-green-600">{message}</p>}
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </form>
    );
}