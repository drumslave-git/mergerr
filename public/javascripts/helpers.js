const APPS_TYPES = [
    'radarr',
    'sonarr',
    'whisparr',
    'whisparr-v1',
]

const getItemMergeInfo = (queue, target) => {
    if(!queue || !target) return {}

    const targetItem = queue.find(item => item.downloadId === target)

    const movie = targetItem.manualImport[0].movie

    return {sources: targetItem.manualImport.map(item => item.path), movie}
}