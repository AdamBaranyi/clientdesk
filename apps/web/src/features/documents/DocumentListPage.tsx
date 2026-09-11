import { useRef, useState } from 'react';
import { Download, Eye, EyeOff, FilePlus2, Trash2, Upload } from 'lucide-react';
import { MAX_DOCUMENT_BYTES, type WorkspaceSummary } from '@tallyroom/contracts';
import { Button } from '../../components/base/Button.tsx';
import { Card } from '../../components/base/Card.tsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { ApiRequestError } from '../../lib/api.ts';
import { formatDate } from '../../lib/format.ts';
import { useCustomers } from '../customers/api.ts';
import {
  documentDownloadUrl,
  useAddSampleDocument,
  useDeleteDocument,
  useDocuments,
  useSetDocumentVisibility,
  useUploadDocument,
} from './api.ts';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentListPage({ workspace }: { workspace: WorkspaceSummary }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [customerId, setCustomerId] = useState('');

  const customers = useCustomers(workspace.id, { status: 'active', pageSize: 100 });
  const documents = useDocuments(workspace.id, customerId ? { customerId } : {});
  const upload = useUploadDocument(workspace.id);
  const setVisibility = useSetDocumentVisibility(workspace.id);
  const remove = useDeleteDocument(workspace.id);
  const addSample = useAddSampleDocument(workspace.id);

  const available = customers.data?.data ?? [];
  const uploadTarget = customerId || available[0]?.id || '';

  function chooseFile() {
    upload.reset();
    fileInput.current?.click();
  }

  function onFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !uploadTarget) return;
    upload.mutate({ file, customerId: uploadTarget });
  }

  const uploadMessage =
    upload.error instanceof ApiRequestError
      ? upload.error.message
      : upload.error
        ? 'Der Upload ist fehlgeschlagen. Bitte erneut versuchen.'
        : null;

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.02em]">Dokumente</h1>
          <p className="mt-1 max-w-[62ch] text-sm text-muted">
            {workspace.isDemo
              ? 'In der Demo werden keine eigenen Dateien angenommen. Das enthaltene Beispieldokument zeigt den Ablauf.'
              : `PDF bis ${MAX_DOCUMENT_BYTES / (1024 * 1024)} MiB. Neu hochgeladene Dateien sind intern, bis sie ausdrücklich freigegeben werden.`}
          </p>
        </div>
        {workspace.isDemo ? (
          <Button
            variant="primary"
            disabled={!uploadTarget || addSample.isPending}
            onClick={() => addSample.mutate(uploadTarget)}
          >
            <FilePlus2 size={16} strokeWidth={2} aria-hidden="true" />
            {addSample.isPending ? 'Wird angelegt …' : 'Beispieldokument anlegen'}
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={!uploadTarget || upload.isPending}
            onClick={chooseFile}
          >
            <Upload size={16} strokeWidth={2} aria-hidden="true" />
            {upload.isPending ? 'Wird hochgeladen …' : 'PDF hochladen'}
          </Button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf"
          onChange={onFileChosen}
          className="sr-only"
          aria-label="PDF-Datei auswählen"
        />
      </div>

      {uploadMessage && (
        <p
          role="alert"
          className="rounded-sm border border-line bg-raised px-4 py-3 text-sm text-danger"
        >
          {uploadMessage}
        </p>
      )}

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <label htmlFor="dokument-kunde" className="text-xs font-medium text-muted">
          Kunde
        </label>
        <select
          id="dokument-kunde"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
          className="text-dense min-h-11 rounded-sm border border-line bg-surface px-3 text-ink"
        >
          <option value="">Alle Kunden</option>
          {available.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        {customerId === '' && available.length > 0 && (
          <p className="text-xs text-muted">
            Hochgeladen wird für {available[0]?.name}. Zum Wechseln zuerst den Kunden wählen.
          </p>
        )}
      </div>

      <Card>
        {documents.isPending && <LoadingState label="Dokumente werden geladen …" />}
        {documents.isError && (
          <ErrorState detail="Die Dokumentenliste konnte nicht geladen werden. Bitte Seite neu laden." />
        )}

        {documents.data && documents.data.length === 0 && (
          <EmptyState
            title="Noch keine Dokumente"
            detail={
              available.length === 0
                ? 'Ein Dokument gehört immer zu einem Kunden. Lege zuerst einen Kunden an.'
                : 'Hochgeladene PDF liegen zuerst intern. Erst eine Freigabe zeigt sie im Kundenportal.'
            }
          />
        )}

        {documents.data && documents.data.length > 0 && (
          <ul className="flex flex-col">
            {documents.data.map((document) => (
              <li
                key={document.id}
                className="flex flex-col gap-3 border-t border-line-soft px-4 py-4 sm:flex-row sm:items-center sm:px-5"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-medium break-words">{document.originalName}</span>
                  <span className="flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span>{document.customerName}</span>
                    <span className="font-mono">{formatSize(document.sizeBytes)}</span>
                    <span className="font-mono">{formatDate(document.createdAt.slice(0, 10))}</span>
                    <span
                      className={[
                        'inline-flex items-center gap-1.5 font-medium',
                        document.clientVisible ? 'text-positive' : 'text-muted',
                      ].join(' ')}
                    >
                      {document.clientVisible ? (
                        <Eye size={12} strokeWidth={2} aria-hidden="true" />
                      ) : (
                        <EyeOff size={12} strokeWidth={2} aria-hidden="true" />
                      )}
                      {document.clientVisible ? 'Im Portal sichtbar' : 'Nur intern'}
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={documentDownloadUrl(workspace.id, document.id)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line px-3 text-sm font-medium text-muted no-underline hover:text-ink"
                  >
                    <Download size={15} strokeWidth={1.8} aria-hidden="true" />
                    Öffnen
                  </a>
                  <Button
                    onClick={() =>
                      setVisibility.mutate({
                        documentId: document.id,
                        clientVisible: !document.clientVisible,
                      })
                    }
                    disabled={setVisibility.isPending}
                  >
                    {document.clientVisible ? 'Freigabe zurücknehmen' : 'Für Kunden freigeben'}
                  </Button>
                  <Button
                    variant="danger"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(document.id)}
                  >
                    <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
                    <span className="sr-only">{document.originalName} löschen</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
