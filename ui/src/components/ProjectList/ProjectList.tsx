import { useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import type { PathTheme } from '../../utils/theme.js';
import { useAppSelector, useAppDispatch } from '../../hooks/index.js';
import { projectSelectors, projectActions } from '../../slices/projectSlice.js';
import { trpc } from '../../trpc.js';
import type { Project } from '@ff/common/schemas/projectSchema.js';

const useStyles = createUseStyles<string, object, PathTheme>((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: theme.colors.background.secondary,
    borderRight: `1px solid ${theme.colors.border.primary}`,
  },
  header: {
    padding: theme.spacing.md,
    borderBottom: `1px solid ${theme.colors.border.primary}`,
    backgroundColor: theme.colors.background.tertiary,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.lg,
    fontWeight: 600,
    margin: 0,
  },
  list: {
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing.sm,
  },
  item: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    transition: `all ${theme.transitions.fast}`,
    border: `1px solid transparent`,
    '&:hover': {
      borderColor: theme.colors.border.secondary,
    },
  },
  itemSelected: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: theme.colors.background.primary,
  },
  itemName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
    fontWeight: 500,
    marginBottom: theme.spacing.xs,
  },
  itemDescription: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCoords: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSize.xs,
    fontFamily: 'monospace',
  },
  statusBadge: {
    padding: `${theme.spacing.xs / 2}px ${theme.spacing.sm}px`,
    borderRadius: theme.borderRadius.sm,
    fontSize: theme.fontSize.xs,
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  statusActive: {
    backgroundColor: `${theme.colors.status.success}22`,
    color: theme.colors.status.success,
  },
  statusInactive: {
    backgroundColor: `${theme.colors.status.warning}22`,
    color: theme.colors.status.warning,
  },
  statusArchived: {
    backgroundColor: `${theme.colors.text.muted}22`,
    color: theme.colors.text.muted,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    color: theme.colors.text.muted,
  },
  error: {
    padding: theme.spacing.md,
    color: theme.colors.status.error,
    textAlign: 'center',
  },
  empty: {
    padding: theme.spacing.xl,
    textAlign: 'center',
    color: theme.colors.text.muted,
  },
}));

interface ProjectListProps {
  onProjectSelect?: (project: Project) => void;
}

export default function ProjectList({ onProjectSelect }: ProjectListProps) {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const projects = useAppSelector(projectSelectors.selectItemsArray);
  const selectedId = useAppSelector(projectSelectors.selectSelectedId);
  const loading = useAppSelector(projectSelectors.selectLoading);
  const error = useAppSelector(projectSelectors.selectError);

  const { data, isLoading, error: queryError } = trpc.project.list.useQuery();

  useEffect(() => {
    dispatch(projectActions.setLoading(isLoading));
  }, [isLoading, dispatch]);

  useEffect(() => {
    if (queryError) {
      dispatch(projectActions.setError(queryError.message));
    }
  }, [queryError, dispatch]);

  useEffect(() => {
    if (data) {
      dispatch(projectActions.setItems(data));
    }
  }, [data, dispatch]);

  const handleItemClick = (project: Project) => {
    dispatch(projectActions.setSelectedId(project.id));
    onProjectSelect?.(project);
  };

  const getStatusClass = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return classes.statusActive;
      case 'inactive':
        return classes.statusInactive;
      case 'archived':
        return classes.statusArchived;
    }
  };

  if (loading) {
    return (
      <div className={classes.container}>
        <div className={classes.header}>
          <h2 className={classes.title}>Projects</h2>
        </div>
        <div className={classes.loading}>Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.container}>
        <div className={classes.header}>
          <h2 className={classes.title}>Projects</h2>
        </div>
        <div className={classes.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h2 className={classes.title}>Projects ({projects.length})</h2>
      </div>
      <div className={classes.list}>
        {projects.length === 0 ? (
          <div className={classes.empty}>No projects yet</div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className={`${classes.item} ${
                selectedId === project.id ? classes.itemSelected : ''
              }`}
              onClick={() => handleItemClick(project)}
            >
              <div className={classes.itemName}>{project.name}</div>
              {project.description && (
                <div className={classes.itemDescription}>{project.description}</div>
              )}
              <div className={classes.itemMeta}>
                <span className={classes.itemCoords}>
                  {project.latitude.toFixed(4)}, {project.longitude.toFixed(4)}
                </span>
                <span className={`${classes.statusBadge} ${getStatusClass(project.status)}`}>
                  {project.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
