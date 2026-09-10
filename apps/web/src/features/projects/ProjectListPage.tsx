import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { PROJECT_STATUS, type ProjectStatus, type WorkspaceSummary } from '@clientdesk/contracts';
import { Button } from '../../components/base/Button.tsx';
import { workspacePath } from '../../lib/paths.ts';
import { Card } from '../../components/base/Card.tsx';
import { Dialog } from '../../components/base/Dialog.tsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/base/EmptyState.tsx';
import { Pagination } from '../../components/base/Pagination.tsx';
import { useCustomers } from '../customers/api.ts';
import { useCreateProject, useProjects } from './api.ts';
import { ProjectForm } from './ProjectForm.tsx';
import { ProjectRows } from './ProjectRows.tsx';
import { SearchField, SelectField } from '../../components/base/Controls.tsx';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: 'Geplant',
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
  archived: 'Archiviert',
};

export function ProjectListPage({ workspace }: { workspace: WorkspaceSummary }) {
  const [params, setParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);

  const search = params.get('search') ?? '';
  const status = (params.get('status') as ProjectStatus | null) ?? undefined;
  const page = Number(params.get('page') ?? '1');

  const query = useProjects(workspace.id, { search, ...(status ? { status } : {}), page });
  // Nur aktive Kunden können ein neues Projekt bekommen.
  const customers = useCustomers(workspace.id, { status: 'active', pageSize: 100 });
  const create = useCreateProject(workspace.id);

  function patchParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  }

  const availableCustomers = customers.data?.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.02em]">Projekte</h1>
          <p className="mt-1 text-sm text-muted">Alle Projekte über alle Kunden.</p>
        </div>
        <Button
          variant="primary"
          disabled={availableCustomers.length === 0}
          onClick={() => setDialogOpen(true)}
        >
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          Projekt anlegen
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          value={search}
          onChange={(wert) => patchParams({ search: wert })}
          placeholder="Projekt oder Kunde"
          label="Projekte durchsuchen"
        />

        <SelectField
          id="projekt-status-filter"
          label="Nach Status filtern"
          labelHidden
          value={status ?? ''}
          onChange={(event) => patchParams({ status: event.target.value || null })}
        >
          <option value="">Alle Status</option>
          {PROJECT_STATUS.map((option) => (
            <option key={option} value={option}>
              {STATUS_LABELS[option]}
            </option>
          ))}
        </SelectField>
      </div>

      <Card>
        {query.isPending && <LoadingState label="Projekte werden geladen …" />}
        {query.isError && (
          <ErrorState detail="Die Projektliste konnte nicht geladen werden. Bitte Seite neu laden." />
        )}

        {query.data && query.data.data.length === 0 && (
          <EmptyState
            title={search || status ? 'Kein Treffer' : 'Noch keine Projekte'}
            detail={
              search || status
                ? 'In dieser Ansicht gibt es kein Projekt. Suchbegriff oder Statusfilter ändern.'
                : availableCustomers.length === 0
                  ? 'Ein Projekt gehört immer zu einem Kunden. Lege zuerst einen Kunden an.'
                  : 'Sobald das erste Projekt angelegt ist, erscheint es hier mit Fortschritt und Zieltermin.'
            }
          />
        )}

        {query.data && query.data.data.length > 0 && (
          <>
            <div className="pt-4">
              <ProjectRows
                projects={query.data.data}
                basePath={workspacePath(workspace.id, 'projects')}
              />
            </div>
            <Pagination
              pagination={query.data.pagination}
              onChange={(next) => patchParams({ page: String(next) })}
            />
          </>
        )}
      </Card>

      <Dialog open={dialogOpen} title="Projekt anlegen" onClose={() => setDialogOpen(false)}>
        <ProjectForm
          customers={availableCustomers}
          pending={create.isPending}
          error={create.error}
          onCancel={() => setDialogOpen(false)}
          onSubmit={(values) =>
            create.mutate(values, {
              onSuccess: () => {
                create.reset();
                setDialogOpen(false);
              },
            })
          }
        />
      </Dialog>
    </div>
  );
}
