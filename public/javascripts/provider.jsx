const DataContext = React.createContext({});

const fetchQueue = async (appType) => {
    const res = await fetch('/queue?appType=' + appType)
    return await res.json()
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
    const mergeInfo = getItemMergeInfo(queue, target)

    React.useEffect(() => {
        setQueue(null)
        fetch('/config')
            .then(res => res.json())
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
    }, [appType])

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
    }, [appType])

    React.useEffect(() => {
        setAppUrl(configs[appType]?.appUrl || '')
        setApiKey(configs[appType]?.apiKey || '')
    }, [configs, appType])

    const saveConfig = React.useCallback(() => {
        fetch('/config', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                appType,
                appUrl,
                apiKey
            })
        }).then(res => res.json())
            .then(data => {
                setConfigs(data)
                alert('Config saved for: ' + appType)
            })
    }, [appType, appUrl, apiKey])

    const mergeVideos = React.useCallback(() => {
        fetch('/merge', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sources: mergeInfo.sources,
                targetFolder: mergeInfo.movie.path,
                title: mergeInfo.movie.cleanTitle
            })
        }).then(res => res.json())
            .then(data => {
                alert('Merge result: ' + data.result)
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
        toasts, addToast: (toast) => setToasts(items => [...items, toast]), removeToast: (toast) => setToasts(items => items.filter(t => t !== toast))
    }}>
        {children}
    </DataContext.Provider>
}