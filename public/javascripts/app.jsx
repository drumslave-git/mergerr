const APPS_TYPES = [
    'radarr',
    'sonarr',
    'whisparr',
    'whisparr-v1',
]

const DataContext = React.createContext({});

const usePersistedState = (key, defaultValue) => {
    const [value, setValue] = React.useState(() => {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            return JSON.parse(storedValue);
        }
        return defaultValue;
    });

    React.useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}

const DataProvider = ({children}) => {
    const [target, setTarget] = React.useState(null)
    const [sources, setSources] = React.useState(null)
    const [configs, setConfigs] = React.useState({});
    const [appType, setAppType] = usePersistedState('appType', APPS_TYPES[0]);
    const [appUrl, setAppUrl] = React.useState('')
    const [apiKey, setApiKey] = React.useState('')
    const [queue, setQueue] = React.useState([])
    const mergeInfo = getItemMergeInfo(queue, target)

    React.useEffect(() => {
        fetch('/config')
            .then(res => res.json())
            .then(data => {
                setConfigs(data)
            })
    }, [])

    React.useEffect(() => {
        fetch('/queue?appType=' + appType)
            .then(res => res.json())
            .then((json) => {
                if(json.error) {
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
        mergeVideos
    }}>
        {children}
    </DataContext.Provider>
}

const getItemMergeInfo = (queue, target) => {
    const targetItem = queue.find(item => item.downloadId === target)

    if(!targetItem) return {}

    const movie = targetItem.manualImport[0].movie

    return {sources: targetItem.manualImport.map(item => item.path), movie}
}

const Dialog = ({children, onClose, onAction}) => {
    return <dialog open>
        {children}
        <menu>
            <button onClick={onClose}>Close</button>
            <button onClick={onAction}>OK</button>
        </menu>
    </dialog>
}

const MoviesList = ({filter = '', onClick}) => {
    const {appType} = React.useContext(DataContext);

    const [movies, setMovies] = React.useState([])
    const [filteredMovies, setFilteredMovies] = React.useState([])

    React.useEffect(() => {
        fetch(`/movie?appType=${appType}`).then(res => res.json())
            .then((json = []) => setMovies((json.data || []).sort((movieA, movieB) => {
                if (movieA.title.toLowerCase() < movieB.title.toLowerCase()) {
                    return -1;
                }
                if (movieA.title.toLowerCase() > movieB.title.toLowerCase()) {
                    return 1;
                }
                return 0;
            })))
    }, [appType])

    React.useEffect(() => {
        setFilteredMovies(movies.filter(movie => movie.title.toLowerCase().includes(filter.toLowerCase())))
    }, [movies, filter])

    return <div>
        <div style={{height: '30vh', overflow: 'auto'}}>
            {filteredMovies.map(movie => (
                <div key={movie.id}
                     onClick={() => onClick(movie)}
                >{movie.title} ({movie.year})</div>
            ))}
        </div>
    </div>
}

const MergeInfo = () => {
    const {queue, target, setQueue} = React.useContext(DataContext);
    const {sources, movie} = getItemMergeInfo(queue, target)

    const [filter, setFilter] = React.useState('')

    const onSelectedMovie = React.useCallback((movie) => {
        setQueue(q => q.map(item => item.downloadId === target ? {
            ...item, manualImport: item.manualImport.map((manual) => ({
                ...manual,
                movie
            }))
        } : item))
    }, [target])

    const onDropMovie = React.useCallback(() => {
        setQueue(q => q.map(item => item.downloadId === target ? {
            ...item, manualImport: item.manualImport.map((manual) => ({
                ...manual,
                movie: undefined
            }))
        } : item))
    }, [target])

    return <div>
        {sources.map(source => (
            <div key={source}>
                {source}
            </div>
        ))}
        {!movie && (
            <>
                <input type="text" value={filter} onChange={e => setFilter(e.target.value)} />
                <hr />
                <MoviesList onClick={onSelectedMovie} filter={filter} />
            </>
        )}
        {movie && (
            <div>
                <strong>Target:</strong> {movie.path} - {movie.cleanTitle} <button onClick={onDropMovie}>Drop</button>
            </div>
        )}
    </div>
}

const Main = () => {
    const {apiKey, setApiKey, appUrl, setAppUrl, saveConfig, appType, setAppType, queue, target, setTarget, mergeVideos} = React.useContext(DataContext);

    const onMerge = React.useCallback((e) => {
        e.preventDefault()
        setTarget(e.target.dataset.downloadid)
    }, [queue])

    return (
        <>
            <div>
                <label>
                    App Type:
                    <select name="appType" onChange={e => setAppType(e.target.value)} value={appType}>
                        {APPS_TYPES.map(app => <option key={app} value={app}>{app}</option>)}
                    </select>
                </label>
                <label>
                    App URL:
                    <input type="url" name="appUrl" onChange={e => setAppUrl(e.target.value)} value={appUrl} />
                </label>
                <label>
                    API Key:
                    <input type="text" name="apiKey" onChange={e => setApiKey(e.target.value)} value={apiKey}/>
                </label>
                <button onClick={() => saveConfig()}>Save</button>
            </div>
            <hr/>
            <div>
                {queue.map(item => (
                    <div key={item.downloadId}>
                        {item.title} <button data-downloadid={item.downloadId} onClick={onMerge}>Merge</button>
                        <div style={{paddingLeft: '1rem'}}>
                            {item.manualImport.map(manual => (
                                <div key={manual.id}>
                                    {manual.relativePath}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {target && <Dialog onClose={() => setTarget(null)} onAction={mergeVideos}>
                <MergeInfo/>
            </Dialog>}
        </>
    );
};

const App = () => {
    return (
        <DataProvider>
            <Main/>
        </DataProvider>
    );
}

ReactDOM.render(<App/>, document.getElementById('root'));