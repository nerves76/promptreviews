'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import imageCompression from 'browser-image-compression';
import Icon from '@/components/Icon';
import LocationPicker from '@/components/GoogleBusinessProfile/LocationPicker';
import type {
  GoogleBusinessScheduledPost,
  GoogleBusinessScheduledPostResult,
  GoogleBusinessScheduledMediaDescriptor,
} from '@/features/social-posting';

interface GoogleBusinessLocation {
  id: string;
  name: string;
  address: string;
}

interface SchedulerMedia extends GoogleBusinessScheduledMediaDescriptor {
  previewUrl: string;
}

interface SchedulerQueueResponse {
  upcoming: Array<GoogleBusinessScheduledPost & { results?: GoogleBusinessScheduledPostResult[] }>;
  past: Array<GoogleBusinessScheduledPost & { results?: GoogleBusinessScheduledPostResult[] }>;
}

interface GoogleBusinessSchedulerProps {
  locations: GoogleBusinessLocation[];
  isConnected: boolean;
  maxLocations?: number;
  minimumDate?: string;
  initialLocationIds?: string[];
}

const CALL_TO_ACTION_OPTIONS = [
  { value: 'LEARN_MORE', label: 'Learn More' },
  { value: 'CALL', label: 'Call' },
  { value: 'ORDER_ONLINE', label: 'Order Online' },
  { value: 'BOOK', label: 'Book' },
  { value: 'SIGN_UP', label: 'Sign Up' },
  { value: 'BUY', label: 'Buy' },
];

const SUPPORTED_TIMEZONES = typeof Intl !== 'undefined' && typeof (Intl as any).supportedValuesOf === 'function'
  ? (Intl as any).supportedValuesOf('timeZone')
  : [];

const DEFAULT_TIMEZONE = typeof Intl !== 'undefined'
  ? Intl.DateTimeFormat().resolvedOptions().timeZone
  : 'America/Los_Angeles';

const compressionOptions: any = {
  maxSizeMB: 0.3, // 300KB to be extra safe with Supabase limits
  maxWidthOrHeight: 1080, // Reduce further for better compression
  useWebWorker: true,
  // Only convert PNG to JPEG, keep JPEG as JPEG
  fileType: 'image/jpeg',
  initialQuality: 0.8, // Slightly lower quality for smaller files
  alwaysKeepResolution: false, // Allow resizing for compression
};

function formatStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'completed':
      return 'Completed';
    case 'partial_success':
      return 'Partial';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

function statusBadgeClasses(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'processing':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'partial_success':
      return 'bg-purple-100 text-purple-700 border border-purple-200';
    case 'failed':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-600 border border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
}

function isValidUrl(value: string, allowTel = false): boolean {
  if (!value) return false;
  if (allowTel && value.startsWith('tel:')) {
    return value.length > 4;
  }
  try {
    new URL(value);
    return true;
  } catch (error) {
    return false;
  }
}

export default function GoogleBusinessScheduler({
  locations,
  isConnected,
  maxLocations,
  minimumDate,
  initialLocationIds,
}: GoogleBusinessSchedulerProps) {
  const [mode, setMode] = useState<'post' | 'photo'>('post');
  const [postContent, setPostContent] = useState('');
  const [caption, setCaption] = useState('');
  const [ctaEnabled, setCtaEnabled] = useState(false);
  const [ctaType, setCtaType] = useState('LEARN_MORE');
  const [ctaUrl, setCtaUrl] = useState('');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>(() => {
    if (initialLocationIds && initialLocationIds.length > 0) {
      return initialLocationIds;
    }
    if (locations.length === 1) {
      return [locations[0].id];
    }
    return [];
  });
  const [scheduledDate, setScheduledDate] = useState(() => minimumDate || new Date().toISOString().split('T')[0]);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [mediaItems, setMediaItems] = useState<SchedulerMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [queue, setQueue] = useState<SchedulerQueueResponse>({ upcoming: [], past: [] });
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  const locationOptions = useMemo(() => (
    locations.map((loc) => ({ id: loc.id, name: loc.name }))
  ), [locations]);

  const minDate = minimumDate || new Date().toISOString().split('T')[0];

  const resetForm = useCallback(() => {
    setMode('post');
    setPostContent('');
    setCaption('');
    setCtaEnabled(false);
    setCtaType('LEARN_MORE');
    setCtaUrl('');
    setSelectedLocationIds([]);
    setScheduledDate(minDate);
    setTimezone(DEFAULT_TIMEZONE);
    setMediaItems([]);
    setEditingId(null);
    setSubmissionResult(null);
  }, [minDate]);

  const fetchQueue = useCallback(async () => {
    if (!isConnected) return;
    setIsLoadingQueue(true);
    try {
      const response = await fetch('/api/social-posting/scheduled');
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch scheduled items');
      }
      setQueue({
        upcoming: data.data.upcoming ?? [],
        past: data.data.past ?? [],
      });
    } catch (error) {
      console.error('[Scheduler] Failed to load queue', error);
      setQueue({ upcoming: [], past: [] });
    } finally {
      setIsLoadingQueue(false);
    }
  }, [isConnected]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    if (initialLocationIds && initialLocationIds.length > 0) {
      setSelectedLocationIds(initialLocationIds);
      return;
    }
    if (locationOptions.length === 1) {
      setSelectedLocationIds([locationOptions[0].id]);
    }
  }, [initialLocationIds, locationOptions]);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setSubmissionResult(null);

    try {
      for (const file of Array.from(files)) {
        // Validate file type before compression
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type.toLowerCase())) {
          throw new Error(`${file.name} is not a supported format. Please use JPG, PNG, or GIF images.`);
        }

        // Warn about large files (over 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose an image under 10MB.`);
        }

        console.log('[Scheduler] Starting compression for:', file.name, 'Size:', (file.size / 1024).toFixed(1), 'KB');

        let compressed;
        try {
          compressed = await imageCompression(file, compressionOptions);
          console.log('[Scheduler] Compressed to:', (compressed.size / 1024).toFixed(1), 'KB');
        } catch (compressionError) {
          console.error('[Scheduler] Compression failed:', compressionError);
          throw new Error(`Failed to compress ${file.name}. Please try a different image.`);
        }

        const formData = new FormData();
        formData.append('file', compressed, file.name);
        formData.append('folder', 'social-posts/scheduled');

        console.log('[Scheduler] Uploading compressed image...');
        const response = await fetch('/api/social-posting/upload-image', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          console.error('[Scheduler] Upload API error:', data);
          throw new Error(data.error || 'Failed to upload image');
        }

        const descriptor: SchedulerMedia = {
          bucket: data.bucket,
          path: data.path,
          publicUrl: data.url,
          size: data.size,
          mime: data.mime,
          checksum: data.checksum,
          originalName: data.originalName,
          previewUrl: data.url,
        };

        setMediaItems((prev) => [...prev, descriptor]);
      }
    } catch (error) {
      console.error('[Scheduler] Upload failed', error);
      setSubmissionResult({ success: false, message: error instanceof Error ? error.message : 'Failed to upload image' });
    } finally {
      setIsUploading(false);
    }
  }, []);

  const removeMediaItem = useCallback((index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const canSubmit = useMemo(() => {
    if (!isConnected) return false;
    if (selectedLocationIds.length === 0) return false;
    if (!scheduledDate || scheduledDate < minDate) return false;
    if (mode === 'post') {
      return postContent.trim().length > 0;
    }
    return mediaItems.length > 0;
  }, [isConnected, selectedLocationIds, scheduledDate, minDate, mode, postContent, mediaItems]);

  const payloadLocations = useMemo(() => {
    const lookup = new Map(locations.map((loc) => [loc.id, loc.name]));
    return selectedLocationIds.map((id) => ({ id, name: lookup.get(id) }));
  }, [locations, selectedLocationIds]);

  const submitSchedule = useCallback(async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const body: any = {
        postKind: mode,
        scheduledDate,
        timezone,
        locations: payloadLocations,
        media: mediaItems.map(({ previewUrl, ...rest }) => rest),
      };

      if (mode === 'post') {
        body.postType = 'WHATS_NEW';
        body.content = {
          summary: postContent.trim(),
          callToAction: ctaEnabled
            ? {
                actionType: ctaType,
                url: ctaType === 'CALL' && !ctaUrl.startsWith('tel:')
                  ? `tel:${ctaUrl.replace(/[^0-9+]/g, '')}`
                  : ctaUrl,
              }
            : null,
        };
      } else {
        body.caption = caption.trim() || null;
      }

      if (ctaEnabled) {
        const allowTel = ctaType === 'CALL';
        if (!isValidUrl(body.content?.callToAction?.url ?? '', allowTel)) {
          throw new Error('Please provide a valid call-to-action URL');
        }
      }

      const endpoint = editingId
        ? `/api/social-posting/scheduled/${editingId}`
        : '/api/social-posting/scheduled';

      const response = await fetch(endpoint, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to schedule content');
      }

      setSubmissionResult({ success: true, message: editingId ? 'Schedule updated!' : 'Scheduled successfully!' });
      await fetchQueue();
      resetForm();
    } catch (error) {
      console.error('[Scheduler] Submit failed', error);
      setSubmissionResult({ success: false, message: error instanceof Error ? error.message : 'Failed to schedule content' });
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, mode, scheduledDate, timezone, payloadLocations, mediaItems, postContent, ctaEnabled, ctaType, ctaUrl, caption, editingId, fetchQueue, resetForm]);

  const handleEdit = useCallback(async (id: string) => {
    setIsLoadingEdit(true);
    setSubmissionResult(null);
    try {
      const response = await fetch(`/api/social-posting/scheduled/${id}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load scheduled item');
      }

      const record = data.data as GoogleBusinessScheduledPost & { results?: GoogleBusinessScheduledPostResult[] };

      setEditingId(record.id);
      setMode(record.postKind);
      setScheduledDate(record.scheduledDate);
      setTimezone(record.timezone);
      setSelectedLocationIds(record.selectedLocations?.map((loc: any) => loc.id) ?? []);
      setMediaItems((record.mediaPaths ?? []).map((media: any) => ({
        bucket: media.bucket,
        path: media.path,
        publicUrl: media.publicUrl,
        size: media.size,
        mime: media.mime,
        checksum: media.checksum,
        originalName: media.originalName,
        previewUrl: media.publicUrl,
      })));

      if (record.postKind === 'post') {
        setPostContent(record.content?.summary ?? '');
        if (record.content?.callToAction) {
          setCtaEnabled(true);
          setCtaType(record.content.callToAction.actionType ?? 'LEARN_MORE');
          setCtaUrl(record.content.callToAction.url ?? '');
        } else {
          setCtaEnabled(false);
          setCtaType('LEARN_MORE');
          setCtaUrl('');
        }
        setCaption('');
      } else {
        setPostContent('');
        setCtaEnabled(false);
        setCtaType('LEARN_MORE');
        setCtaUrl('');
        setCaption(record.caption ?? '');
      }

      setSubmissionResult({ success: true, message: 'Loaded schedule for editing.' });
    } catch (error) {
      console.error('[Scheduler] Edit load failed', error);
      setSubmissionResult({ success: false, message: error instanceof Error ? error.message : 'Failed to load schedule for editing' });
    } finally {
      setIsLoadingEdit(false);
    }
  }, []);

  const handleCancel = useCallback(async (id: string) => {
    setSubmissionResult(null);
    try {
      const response = await fetch(`/api/social-posting/scheduled/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to cancel scheduled post');
      }
      if (editingId === id) {
        resetForm();
      }
      await fetchQueue();
      setSubmissionResult({ success: true, message: 'Scheduled item cancelled.' });
    } catch (error) {
      console.error('[Scheduler] Cancel failed', error);
      setSubmissionResult({ success: false, message: error instanceof Error ? error.message : 'Failed to cancel scheduled item' });
    }
  }, [fetchQueue, editingId, resetForm]);

  if (!isConnected) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <Icon name="FaGoogle" className="w-5 h-5 text-gray-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Connect Google Business Profile</h3>
            <p className="text-sm text-gray-600">Connect your Google Business Profile to schedule posts and photo uploads.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Schedule Google Business Content</h2>
          <p className="text-sm text-gray-600">
            Pick your locations, choose when to publish, and decide whether you&apos;re posting an update or scheduling a photo upload.
          </p>
        </div>

        {submissionResult && (
          <div
            className={`mb-4 rounded-md border px-4 py-3 text-sm flex items-center justify-between ${
              submissionResult.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Icon
                name={submissionResult.success ? 'FaCheckCircle' : 'FaExclamationTriangle'}
                className={`w-4 h-4 ${submissionResult.success ? 'text-emerald-500' : 'text-rose-500'}`}
              />
              <span>{submissionResult.message}</span>
            </div>
            <button
              onClick={() => setSubmissionResult(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Locations:</p>
            {locationOptions.length <= 1 ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                Google Business Profile: {locationOptions[0]?.name || 'No locations connected'}
              </div>
            ) : (
              <LocationPicker
                mode="multi"
                locations={locationOptions}
                selectedIds={selectedLocationIds}
                onChange={setSelectedLocationIds}
                includeSelectAll
                maxSelections={maxLocations ?? undefined}
                className="bg-gray-50 rounded-lg p-4"
                helperText={maxLocations ? `Your plan allows up to ${maxLocations} locations per schedule.` : 'You can adjust locations any time before the batch runs.'}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Date &amp; Timezone</label>
            <div className="flex flex-col md:flex-row md:space-x-3 space-y-3 md:space-y-0">
              <input
                type="date"
                min={minDate}
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
                className="w-full md:w-48 rounded-md border-gray-300 focus:border-slate-500 focus:ring-slate-500"
              />
              <select
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="w-full md:flex-1 rounded-md border-gray-300 focus:border-slate-500 focus:ring-slate-500"
              >
                {SUPPORTED_TIMEZONES.length > 0 ? (
                  SUPPORTED_TIMEZONES.map((tz: string) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))
                ) : (
                  <option value={timezone}>{timezone}</option>
                )}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">Posts and photos go out during the morning batch in the timezone you choose.</p>
          </div>

          <fieldset className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <legend className="sr-only">Content Type</legend>
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
              <label className={`flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                mode === 'post'
                  ? 'border-slate-500 bg-white shadow-sm'
                  : 'border-transparent bg-transparent hover:bg-white'
              }`}>
                <input
                  type="radio"
                  name="gbp-schedule-mode"
                  value="post"
                  checked={mode === 'post'}
                  onChange={() => {
                    setMode('post');
                    setSubmissionResult(null);
                  }}
                  className="h-4 w-4 text-slate-600 focus:ring-slate-500"
                />
                <div>
                  <p className="font-medium text-sm text-gray-900">Schedule a Post</p>
                  <p className="text-xs text-gray-600">Publishes a Google Business update with optional media and CTA.</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                mode === 'photo'
                  ? 'border-slate-500 bg-white shadow-sm'
                  : 'border-transparent bg-transparent hover:bg-white'
              }`}>
                <input
                  type="radio"
                  name="gbp-schedule-mode"
                  value="photo"
                  checked={mode === 'photo'}
                  onChange={() => {
                    setMode('photo');
                    setSubmissionResult(null);
                  }}
                  className="h-4 w-4 text-slate-600 focus:ring-slate-500"
                />
                <div>
                  <p className="font-medium text-sm text-gray-900">Schedule a Photo</p>
                  <p className="text-xs text-gray-600">Adds the image to each selected location&apos;s gallery on the scheduled day.</p>
                </div>
              </label>
            </div>
          </fieldset>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {mode === 'post' ? 'Optional Images' : 'Photos to Upload'}
              </label>
              <div className="text-xs text-gray-500">
                {mediaItems.length} attached · Max 10
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {mediaItems.map((media, index) => (
                <div key={`${media.path}-${index}`} className="relative group">
                  <img
                    src={media.previewUrl}
                    alt={media.originalName ?? 'Upload preview'}
                    className="h-24 w-24 rounded-md object-cover border border-gray-200"
                  />
                  <button
                    onClick={() => removeMediaItem(index)}
                    className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 text-gray-600 shadow-sm hover:bg-gray-100"
                    title="Remove"
                  >
                    <Icon name="FaTimes" className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {mediaItems.length < 10 && (
                <label className={`border border-dashed border-gray-300 rounded-md h-24 w-24 flex items-center justify-center text-sm text-gray-500 cursor-pointer hover:border-slate-400 hover:text-slate-600 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    className="hidden"
                    multiple
                    disabled={isUploading}
                    onChange={(event) => handleFileUpload(event.target.files)}
                  />
                  {isUploading ? 'Uploading…' : 'Add'}
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500">Images are automatically compressed to ~300KB for fast loading. Accepts JPG, PNG, or GIF up to 10MB.</p>
          </div>

          {mode === 'post' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Post Content</label>
                <textarea
                  value={postContent}
                  onChange={(event) => setPostContent(event.target.value)}
                  rows={4}
                  className="w-full rounded-md border-gray-300 focus:border-slate-500 focus:ring-slate-500"
                  placeholder="Share your update..."
                />
                <p className="mt-1 text-xs text-gray-500">Google Business posts support up to 1,500 characters.</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Call to Action</label>
                  <button
                    onClick={() => setCtaEnabled((prev) => !prev)}
                    className={`text-xs font-medium px-2 py-1 rounded ${ctaEnabled ? 'bg-slate-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}
                  >
                    {ctaEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
                {ctaEnabled && (
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:space-x-3 space-y-3 md:space-y-0">
                      <select
                        value={ctaType}
                        onChange={(event) => setCtaType(event.target.value)}
                        className="md:w-48 rounded-md border-gray-300 focus:border-slate-500 focus:ring-slate-500"
                      >
                        {CALL_TO_ACTION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={ctaUrl}
                        onChange={(event) => setCtaUrl(event.target.value)}
                        placeholder={ctaType === 'CALL' ? 'tel:+15551234567' : 'https://example.com'}
                        className="flex-1 rounded-md border-gray-300 focus:border-slate-500 focus:ring-slate-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {ctaType === 'CALL'
                        ? 'Provide a phone number using tel: format (e.g. tel:+15551234567).'
                        : 'Use a full URL including https://'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photo Caption (optional)</label>
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                rows={3}
                className="w-full rounded-md border-gray-300 focus:border-slate-500 focus:ring-slate-500"
                placeholder="Describe the photo for customers..."
              />
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-gray-100">
            {editingId && (
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel Edit
              </button>
            )}
            <button
              onClick={submitSchedule}
              disabled={!canSubmit || isSubmitting || isUploading || isLoadingEdit}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
                !canSubmit || isSubmitting || isUploading || isLoadingEdit
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-slate-600 hover:bg-slate-700'
              }`}
            >
              {isSubmitting ? 'Saving…' : editingId ? 'Update Schedule' : 'Schedule'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Scheduled Queue</h3>
            <p className="text-sm text-gray-600">Upcoming items publish during the next daily batch. Past items show the latest status.</p>
          </div>
          <button
            onClick={fetchQueue}
            className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-800"
          >
            <Icon name="FaSync" className={`w-3 h-3 ${isLoadingQueue ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {isLoadingQueue ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Icon name="FaSpinner" className="w-5 h-5 animate-spin mr-2" /> Loading scheduled items…
          </div>
        ) : queue.upcoming.length === 0 && queue.past.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-md py-10 text-center text-sm text-gray-500">
            No scheduled content yet. Create a post or photo upload above.
          </div>
        ) : (
          <div className="space-y-6">
            {queue.upcoming.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Upcoming</h4>
                <div className="space-y-3">
                  {queue.upcoming.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{item.postKind === 'photo' ? 'Photo Upload' : 'Post'}</span>
                            <span>•</span>
                            <span>{new Date(item.scheduledDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{item.selectedLocations?.length || 0} location(s)</span>
                          </div>
                          {item.postKind === 'post' && item.content?.summary && (
                            <p className="mt-2 text-sm text-gray-700 line-clamp-2">{item.content.summary}</p>
                          )}
                          {item.postKind === 'photo' && item.caption && (
                            <p className="mt-2 text-sm text-gray-700 line-clamp-2">{item.caption}</p>
                          )}
                        </div>
                        <div className="mt-3 md:mt-0 flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClasses(item.status)}`}>
                            {formatStatusLabel(item.status)}
                          </span>
                          <button
                            onClick={() => handleEdit(item.id)}
                            className="px-2 py-1 text-xs font-medium border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
                            disabled={isLoadingEdit}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleCancel(item.id)}
                            className="px-2 py-1 text-xs font-medium border border-rose-200 rounded-md text-rose-600 hover:bg-rose-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {queue.past.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Recent Activity</h4>
                <div className="space-y-3">
                  {queue.past.slice(0, 10).map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{item.postKind === 'photo' ? 'Photo Upload' : 'Post'}</span>
                            <span>•</span>
                            <span>{new Date(item.scheduledDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{item.selectedLocations?.length || 0} location(s)</span>
                          </div>
                          {item.postKind === 'post' && item.content?.summary && (
                            <p className="mt-2 text-sm text-gray-700 line-clamp-2">{item.content.summary}</p>
                          )}
                          {item.postKind === 'photo' && item.caption && (
                            <p className="mt-2 text-sm text-gray-700 line-clamp-2">{item.caption}</p>
                          )}
                          {item.errorLog?.locations?.length > 0 && (
                            <div className="mt-2 text-xs text-rose-600">
                              {item.errorLog.locations.length} failure(s):{' '}
                              {item.errorLog.locations.map((entry: any) => entry.locationId).join(', ')}
                            </div>
                          )}
                        </div>
                        <span className={`mt-3 md:mt-0 px-2 py-1 rounded-full text-xs font-medium self-start md:self-auto ${statusBadgeClasses(item.status)}`}>
                          {formatStatusLabel(item.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
