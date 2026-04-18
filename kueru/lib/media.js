/**
 * Shared helpers for recipe media items.
 *
 * Firestore `images` field can be either:
 *   - Legacy: array of plain URL strings (all treated as images)
 *   - New: array of { url: string, type: 'image' | 'video' } objects
 *
 * Use these helpers everywhere instead of accessing `recipe.images` directly.
 */

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.ogg', '.avi'];

/**
 * Detect whether a URL points to a video file.
 * Used as a fallback for legacy plain-URL strings.
 * @param {string} url
 * @returns {boolean}
 */
const isVideoUrl = (url) => {
    if (typeof url !== 'string') return false;
    const lower = url.toLowerCase().split('?')[0]; // strip query params
    return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

/**
 * Normalize a raw item from recipe.images into a consistent { url, type } shape.
 * Handles both legacy plain strings and new { url, type } objects.
 *
 * @param {string | { url: string, type?: string }} item
 * @returns {{ url: string, type: 'image' | 'video' } | null}
 */
export const normalizeMediaItem = (item) => {
    if (!item) return null;

    if (typeof item === 'string') {
        const url = item.trim();
        if (!url) return null;
        return { url, type: isVideoUrl(url) ? 'video' : 'image' };
    }

    if (typeof item === 'object') {
        const url = String(item.url ?? '').trim();
        if (!url) return null;
        const type = item.type === 'video' ? 'video' : (isVideoUrl(url) ? 'video' : 'image');
        return { url, type };
    }

    return null;
};

/**
 * Normalize the full recipe.images array into { url, type }[] items.
 * @param {Array} images
 * @returns {{ url: string, type: 'image' | 'video' }[]}
 */
export const normalizeMediaItems = (images) => {
    if (!Array.isArray(images)) return [];
    return images.map(normalizeMediaItem).filter(Boolean);
};

/**
 * Get the first media item (image or video) in the list, normalized.
 * Used by preview cards that want to show video banners.
 * @param {Array} images
 * @returns {{ url: string, type: 'image' | 'video' } | null}
 */
export const getFirstMediaItem = (images) => {
    const items = normalizeMediaItems(images);
    return items.length > 0 ? items[0] : null;
};

/**
 * Get the URL of the first image (non-video) in the media list.
 * Falls back to the first video URL or a placeholder.
 * @param {Array} images
 * @param {string} [fallback]
 * @returns {string}
 */
export const getPreviewImageUrl = (images, fallback = 'https://placehold.co/600x400?text=Recipe') => {
    const items = normalizeMediaItems(images);
    const firstImage = items.find((item) => item.type === 'image');
    if (firstImage) return firstImage.url;
    if (items.length > 0) return items[0].url;
    return fallback;
};

/**
 * Reconstruct media items from recipe.images for the edit form.
 * Returns items in the shape expected by RecipeMediaSection.
 * @param {Array} images
 * @returns {{ id: string, name: string, type: 'image' | 'video', url: string }[]}
 */
export const parseMediaItemsForEdit = (images) => {
    return normalizeMediaItems(images).map((item, index) => {
        const filePart = item.url.split('%2F').pop()?.split('?')[0] || `media_${index}`;
        const decodedName = decodeURIComponent(filePart);
        const name = decodedName.replace(/^\d+_/, '') || 'Uploaded Media';
        return {
            id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
            name,
            type: item.type,
            url: item.url,
        };
    });
};
