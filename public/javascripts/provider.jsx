const DataContext = React.createContext({});

const fetchQueue = async (appType) => {
    return await api.get('/queue?appType=' + appType)
}

const DataProvider = ({children}) => {
    const [target, setTarget] = React.useState(null)
    const [sources, setSources] = React.useState(null)
    const [configs, setConfigs] = React.useState({});
    const [appType, setAppType] = usePersistedState('appType', APPS_TYPES[0]);
    const [appUrl, setAppUrl] = React.useState('')
    const [apiKey, setApiKey] = React.useState('')
    const [queue, setQueue] = React.useState([])
    const [toasts, setToasts] = React.useState([])
    const [ffmpegLogs, setFfmpegLogs] = React.useState('')
    const [ffmpegStatus, setFfmpegStatus] = React.useState('idle')
    const mergeInfo = getItemMergeInfo(queue, target)

    React.useEffect(() => {
        setQueue(null)
        api.get('/config')
            .then(data => {
                setConfigs(data)
                fetchQueue(appType).then((json) => {
                    if(json.error) {
                        setQueue([])
                        alert(json.error)
                        return
                    }
                    setQueue(json.data)
                })
            })

        const eventSource = new EventSource('/events');

        eventSource.onmessage = ({data: message}) => {
            const json = JSON.parse(message);
            if(json.type === 'ffmpeg-exit') {
                setFfmpegStatus('idle')
                setFfmpegLogs(logs => logs + '\n' + 'Process exit with code:' + json.data + '\n');
            } else {
                setFfmpegStatus('running')
                setFfmpegLogs(logs => logs + json.data + '\n');
            }
        };

        eventSource.onerror = (error) => {
            setFfmpegLogs(logs => logs + error.message + '\n');
        };
    }, [])

    React.useEffect(() => {
        setQueue(null)
        fetchQueue(appType).then((json) => {
                if(json.error) {
                    setQueue([])
                    alert(json.error)
                    return
                }
                setQueue(json.data)
            })
        setAppUrl(configs[appType]?.appUrl || '')
        setApiKey(configs[appType]?.apiKey || '')
    }, [appType, configs])

    const saveConfig = React.useCallback(() => {
        api.post('/config', {
            appType,
            appUrl,
            apiKey
        })
            .then(data => {
                setConfigs(data)
                alert('Config saved for: ' + appType)
            })
    }, [appType, appUrl, apiKey])

    const mergeVideos = React.useCallback(() => {
        api.post('/merge', {
            sources: mergeInfo.sources,
            targetFolder: mergeInfo.movie.path,
            title: mergeInfo.movie.cleanTitle
        })
            .then(data => {
                setFfmpegLogs(logs => logs + data.result + '\n');
                setTarget(null)
            })
    }, [mergeInfo])

    return <DataContext.Provider value={{
        appUrl, setAppUrl,
        apiKey, setApiKey,
        target, setTarget,
        configs, saveConfig,
        appType, setAppType,
        queue, setQueue,
        sources, setSources,
        mergeVideos,
        toasts, addToast: (toast) => setToasts(items => [...items, toast]), removeToast: (toast) => setToasts(items => items.filter(t => t !== toast)),
        ffmpegLogs, setFfmpegLogs,
        ffmpegStatus
    }}>
        {children}
    </DataContext.Provider>
}