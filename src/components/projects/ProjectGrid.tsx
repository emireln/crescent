import React from 'react';
import { IconFolderPlus, IconScan, IconFolderOff } from '@tabler/icons-react';
import { Project } from '../../types';
import { ProjectCard } from './ProjectCard';
import { useProjects } from '../../context/ProjectContext';

interface ProjectGridProps {
  projects: Project[];
}

export const ProjectGrid: React.FC<ProjectGridProps> = ({ projects }) => {
  const { setIsNewProjectOpen, setIsScannerOpen, searchQuery, selectedCategory } = useProjects();

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900 border border-zinc-800 border-dashed rounded-lg">
        <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 mb-4">
          <IconFolderOff size={24} />
        </div>

        <h3 className="text-sm font-semibold text-zinc-100 mb-1">Nenhum projeto encontrado</h3>
        <p className="text-xs text-zinc-400 max-w-sm mb-6">
          {searchQuery
            ? `Nenhum projeto corresponde ao termo "${searchQuery}".`
            : selectedCategory !== 'all'
            ? 'Nenhum projeto nesta categoria.'
            : 'Adicione seus projetos existentes ou realize uma varredura automática para organizar seu workspace.'}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsNewProjectOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-xs font-semibold transition-colors shadow-sm"
          >
            <IconFolderPlus size={15} />
            <span>Adicionar Projeto</span>
          </button>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded text-xs font-medium transition-colors"
          >
            <IconScan size={15} />
            <span>Escanear Diretório</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3.5">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};
