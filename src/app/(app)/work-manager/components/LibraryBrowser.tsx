'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import LibraryTaskCard from './LibraryTaskCard';
import LibraryTaskPreview from './LibraryTaskPreview';
import { useToast, ToastContainer } from '@/app/(app)/components/reviews/Toast';
import {
  WMLibraryTask,
  WMLibraryPack,
  WMLibraryCategory,
  WMLibraryDifficulty,
  WMLibraryTimeEstimate,
  WM_LIBRARY_CATEGORIES,
  WM_LIBRARY_DIFFICULTY,
  WM_LIBRARY_TIME_ESTIMATES,
} from '@/types/workManager';

interface LibraryBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
}

type NavigationItem =
  | { type: 'all' }
  | { type: 'category'; id: WMLibraryCategory }
  | { type: 'pack'; id: string };

export default function LibraryBrowser({ isOpen, onClose, onTaskAdded }: LibraryBrowserProps) {
  // Toast notifications
  const toast = useToast();

  // Data state
  const [packs, setPacks] = useState<WMLibraryPack[]>([]);
  const [tasks, setTasks] = useState<WMLibraryTask[]>([]);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Navigation state
  const [selectedNav, setSelectedNav] = useState<NavigationItem>({ type: 'all' });
  const [selectedPack, setSelectedPack] = useState<WMLibraryPack | null>(null);

  // Filter state
  const [difficultyFilter, setDifficultyFilter] = useState<WMLibraryDifficulty | ''>('');
  const [timeFilter, setTimeFilter] = useState<WMLibraryTimeEstimate | ''>('');

  // Preview state
  const [previewTask, setPreviewTask] = useState<WMLibraryTask | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingPack, setIsAddingPack] = useState(false);

  // Fetch packs on mount
  useEffect(() => {
    if (isOpen) {
      fetchPacks();
    }
  }, [isOpen]);

  // Fetch tasks when navigation or filters change
  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen, selectedNav, difficultyFilter, timeFilter]);

  const fetchPacks = async () => {
    setIsLoadingPacks(true);
    try {
      const response = await apiClient.get<{ packs: WMLibraryPack[] }>('/work-manager/library/packs');
      setPacks(response.packs || []);
    } catch (error) {
      console.error('Error fetching packs:', error);
    } finally {
      setIsLoadingPacks(false);
    }
  };

  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const params = new URLSearchParams();

      if (selectedNav.type === 'category') {
        params.set('category', selectedNav.id);
      } else if (selectedNav.type === 'pack') {
        params.set('pack_id', selectedNav.id);
      }

      if (difficultyFilter) {
        params.set('difficulty', difficultyFilter);
      }
      if (timeFilter) {
        params.set('time_estimate', timeFilter);
      }

      const url = `/work-manager/library/tasks${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<{ tasks: WMLibraryTask[] }>(url);
      setTasks(response.tasks || []);

      // Also fetch pack details if a pack is selected
      if (selectedNav.type === 'pack') {
        const packResponse = await apiClient.get<{ pack: WMLibraryPack }>(`/work-manager/library/packs/${selectedNav.id}`);
        setSelectedPack(packResponse.pack);
      } else {
        setSelectedPack(null);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleNavSelect = (nav: NavigationItem) => {
    setSelectedNav(nav);
    setPreviewTask(null);
    // Clear filters when changing navigation
    setDifficultyFilter('');
    setTimeFilter('');
  };

  const handleAddTask = async (task: WMLibraryTask) => {
    setIsAddingTask(true);
    try {
      await apiClient.post('/work-manager/tasks/from-library', {
        library_task_id: task.id,
      });
      onTaskAdded();
      setPreviewTask(null);
      toast.success('Task added to your board!');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task. Please try again.');
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleAddPack = async () => {
    if (!selectedPack) return;

    setIsAddingPack(true);
    try {
      const response = await apiClient.post<{ count: number }>('/work-manager/tasks/from-pack', {
        pack_id: selectedPack.id,
      });
      onTaskAdded();
      toast.success(`Added ${response.count} tasks to your board!`);
    } catch (error) {
      console.error('Error adding pack:', error);
      toast.error('Failed to add tasks. Please try again.');
    } finally {
      setIsAddingPack(false);
    }
  };

  const getNavLabel = () => {
    if (selectedNav.type === 'all') return 'All tasks';
    if (selectedNav.type === 'category') {
      const cat = WM_LIBRARY_CATEGORIES.find(c => c.id === selectedNav.id);
      return cat?.label || selectedNav.id;
    }
    if (selectedNav.type === 'pack') {
      return selectedPack?.name || 'Pack';
    }
    return 'Tasks';
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} aria-label="Task library browser">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/20" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-7xl h-[90vh] bg-white/15 backdrop-blur-xl rounded-2xl shadow-2xl flex border border-white/30">
                {/* Close button - positioned outside panel bounds */}
                <button
                  className="absolute -top-5 -right-5 bg-white/70 backdrop-blur-xl border border-white/50 rounded-full shadow-lg hover:bg-white/90 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500/50 z-[60]"
                  style={{ width: 40, height: 40 }}
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Sidebar */}
                <div className="w-64 flex-shrink-0 bg-white/10 border-r border-white/20 flex flex-col overflow-hidden rounded-l-2xl">
                  <div className="p-5 border-b border-white/20">
                    <h2 className="text-xl font-bold text-white">Task library</h2>
                    <p className="text-sm text-white/70 mt-1">Browse SEO & AI tasks</p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Packs section */}
                    <div>
                      <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2 px-1">Packs</h3>
                      <div className="space-y-1">
                        {isLoadingPacks ? (
                          <div className="text-sm text-white/60 py-2 px-1">Loading...</div>
                        ) : packs.length === 0 ? (
                          <div className="text-sm text-white/60 py-2 px-1">No packs available</div>
                        ) : (
                          packs.map(pack => (
                            <button
                              key={pack.id}
                              onClick={() => handleNavSelect({ type: 'pack', id: pack.id })}
                              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
                                selectedNav.type === 'pack' && selectedNav.id === pack.id
                                  ? 'bg-slate-blue text-white shadow-md'
                                  : 'text-white/90 hover:bg-white/20'
                              }`}
                            >
                              {pack.icon && <Icon name={pack.icon as any} size={14} />}
                              <span className="flex-1 truncate">{pack.name}</span>
                              {pack.task_count !== undefined && (
                                <span className={`text-xs font-medium ${
                                  selectedNav.type === 'pack' && selectedNav.id === pack.id
                                    ? 'text-white/80'
                                    : 'text-white/60'
                                }`}>
                                  {pack.task_count}
                                </span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Categories section */}
                    <div>
                      <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2 px-1">Categories</h3>
                      <div className="space-y-1">
                        <button
                          onClick={() => handleNavSelect({ type: 'all' })}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                            selectedNav.type === 'all'
                              ? 'bg-slate-blue text-white shadow-md'
                              : 'text-white/90 hover:bg-white/20'
                          }`}
                        >
                          All tasks
                        </button>
                        {WM_LIBRARY_CATEGORIES.map(category => (
                          <button
                            key={category.id}
                            onClick={() => handleNavSelect({ type: 'category', id: category.id as WMLibraryCategory })}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                              selectedNav.type === 'category' && selectedNav.id === category.id
                                ? 'bg-slate-blue text-white shadow-md'
                                : 'text-white/90 hover:bg-white/20'
                            }`}
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  {/* Header */}
                  <div className="p-5 border-b border-white/20 bg-white/5">
                    <div className="flex items-start justify-between gap-6">
                      {/* Title and description - takes more space */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-bold text-white">{getNavLabel()}</h3>
                        {selectedPack?.description && (
                          <p className="text-sm text-white/70 mt-1 max-w-2xl">{selectedPack.description}</p>
                        )}
                      </div>

                      {/* Filters and add button */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <select
                          value={difficultyFilter}
                          onChange={(e) => setDifficultyFilter(e.target.value as WMLibraryDifficulty | '')}
                          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
                        >
                          <option value="">All difficulties</option>
                          {WM_LIBRARY_DIFFICULTY.map(d => (
                            <option key={d.id} value={d.id}>{d.label}</option>
                          ))}
                        </select>
                        <select
                          value={timeFilter}
                          onChange={(e) => setTimeFilter(e.target.value as WMLibraryTimeEstimate | '')}
                          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
                        >
                          <option value="">All times</option>
                          {WM_LIBRARY_TIME_ESTIMATES.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>

                        {/* Add pack button */}
                        {selectedPack && tasks.length > 0 && (
                          <button
                            onClick={handleAddPack}
                            disabled={isAddingPack}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-blue text-white rounded-xl text-sm font-medium hover:bg-slate-blue/90 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl whitespace-nowrap"
                          >
                            {isAddingPack ? (
                              <>
                                <Icon name="FaSpinner" size={14} className="animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Icon name="FaPlus" size={14} />
                                Add all {tasks.length} tasks
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Task grid */}
                  <div className="flex-1 overflow-y-auto p-5">
                    {isLoadingTasks ? (
                      <div className="flex items-center justify-center py-16">
                        <Icon name="FaSpinner" size={28} className="animate-spin text-white/60" />
                      </div>
                    ) : tasks.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                          <Icon name="FaInbox" size={28} className="text-white/60" />
                        </div>
                        <p className="text-white font-medium">No tasks found</p>
                        <p className="text-sm text-white/60 mt-1">
                          {selectedNav.type === 'pack'
                            ? 'This pack has no tasks yet'
                            : 'Try adjusting your filters'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {tasks.map(task => (
                          <LibraryTaskCard
                            key={task.id}
                            task={task}
                            onClick={setPreviewTask}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Task preview sidebar */}
                {previewTask && (
                  <div className="w-[420px] flex-shrink-0 border-l border-white/20 bg-white/10 overflow-hidden rounded-r-2xl">
                    <LibraryTaskPreview
                      task={previewTask}
                      onClose={() => setPreviewTask(null)}
                      onAddToBoard={handleAddTask}
                      isAdding={isAddingTask}
                    />
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        {/* Toast notifications */}
        <ToastContainer toasts={toast.toasts} onClose={toast.closeToast} />
      </Dialog>
    </Transition>
  );
}
