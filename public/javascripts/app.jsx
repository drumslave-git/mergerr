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
    const [files, setFiles] = React.useState([])
    const [targetMovie, setTargetMovie] = React.useState(null)
    const [appUrl, setAppUrl] = usePersistedState('appUrl', '')
    const [apiKey, setApiKey] = usePersistedState('apiKey', '')

    return <DataContext.Provider value={{
        files, setFiles,
        appUrl, setAppUrl,
        apiKey, setApiKey,
        targetMovie, setTargetMovie
    }}>
        {children}
    </DataContext.Provider>
}

const Finder = ({setFiles, selectedFiles}) => {
    const [items, setItems] = React.useState(null);
    const [path, setPath] = React.useState(null);

    React.useEffect(() => {
        const search = new URLSearchParams(window.location.search);
        setPath(search.get('path') || '');
    }, [])

    React.useEffect(() => {
        if (path === null) return;
        fetch(`/scan?path=${path}`)
            .then((response) => response.json())
            .then((data) => {
                setItems(data.items)
            });
    }, [path]);

    const goBack = React.useCallback((e) => {
        e.preventDefault()
        window.location.search =
            '?path=' + encodeURIComponent((new URLSearchParams(location.search)).get('path').split('/').slice(0, -1).join('/'))
    }, [])

    const onFileSelect = React.useCallback(e => {
        setFiles(selected => {
            if (e.target.checked) {
                return [
                    ...selected,
                    {order: 0, path: e.target.value}
                ]
            } else {
                return selected.filter(s => s.path !== e.target.value)
            }
        })
    }, [setFiles])

    if (!items) return <div>Loading...</div>;
    return (
        <div>
            <div>
                <a href={'/?path=' + encodeURIComponent(path + '/..')} onClick={goBack}>
                    ..
                </a>
            </div>
            {items.map((item) => (
                <div key={item.item}>
                    {item.type === 'dir' ? (
                        <a href={'/?path=' + encodeURIComponent(path + '/' + item.item)}>{item.item}</a>
                    ) : (
                        <label htmlFor={item.item}>
                            <input type="checkbox" id={item.item}
                                   checked={selectedFiles.some(f => f.path ===item.path)}
                                   onChange={onFileSelect}
                                   value={item.path}
                            />
                            {item.item}
                        </label>
                    )}
                </div>
            ))}
        </div>
    );
}

const Dialog = ({open, children, onClose, onAction}) => {
    const ref = React.useRef(null)

    React.useEffect(() => {
        if (open) {
            ref.current.showModal()
        } else {
            ref.current.close()
        }
    }, [open])
    return <dialog ref={ref}>
        {children}
        <menu>
            <button onClick={onClose}>Close</button>
            <button onClick={onAction}>OK</button>
        </menu>
    </dialog>
}

const MergeDialog = ({open = false, onClose}) => {
    const {files, setFiles, apiKey, appUrl, targetMovie, setTargetMovie} = React.useContext(DataContext);
    const [movies, setMovies] = React.useState([])
    const [filteredMovies, setFilteredMovies] = React.useState([])
    const [filter, setFilter] = React.useState('')

    React.useEffect(() => {
        if (open) {
            fetch('/movies', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiKey,
                    appUrl
                })
            }).then(res => res.json())
                .then((data = []) => setMovies((data || []).sort((movieA, movieB) => {
                    if (movieA.title.toLowerCase() < movieB.title.toLowerCase()) {
                        return -1;
                    }
                    if (movieA.title.toLowerCase() > movieB.title.toLowerCase()) {
                        return 1;
                    }
                    return 0;
                })))
        }
    }, [open])

    React.useEffect(() => {
        setFilteredMovies(movies.filter(movie => movie.title.toLowerCase().includes(filter.toLowerCase())))
    }, [movies, filter])

    const onAction = React.useCallback(() => {
        fetch('/merge', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sources: files.map(f => f.path),
                targetFolder: targetMovie.path,
                // targetFolder: path,
                title: targetMovie.cleanTitle
            })
        }).then(res => res.json())
            .then(({result}) => {
                alert(result)
            })
    }, [files, targetMovie])

    const onUp = React.useCallback((idx) => {
        if (idx === 0) return;
        setFiles(files => {
            const newFiles = [...files];
            const temp = newFiles[idx];
            newFiles[idx] = newFiles[idx - 1];
            newFiles[idx - 1] = temp;
            return newFiles;
        })
    }, [setFiles])

    const onDown = React.useCallback((idx) => {
        if (idx === files.length - 1) return;
        setFiles(files => {
            const newFiles = [...files];
            const temp = newFiles[idx];
            newFiles[idx] = newFiles[idx + 1];
            newFiles[idx + 1] = temp;
            return newFiles;
        })
    }, [setFiles])

    return <Dialog onClose={onClose} open={open} onAction={onAction}>
        <ul>
            {files.map((file, idx) => <li key={file.path}>
                <button onClick={() => onUp(idx)}>Up</button><button onClick={() => onDown(idx)}>Down</button>
                {file.path}
            </li>)}
        </ul>
        <hr/>
        <input type="text" value={filter} onChange={e => setFilter(e.target.value)}/>
        <div style={{height: '30vh', overflow: 'auto'}}>
            {filteredMovies.map(movie => (
                <div key={movie.id}
                     onClick={() => setTargetMovie(movie)}
                >{movie.title} ({movie.year})</div>
            ))}
        </div>
        <hr/>
        {targetMovie && (
            <>
                <div><b>Target Movie:</b> {targetMovie.title} ({targetMovie.year})</div>
                <div>{targetMovie.path}</div>
            </>
        )}
    </Dialog>
}

const Main = () => {
    const [path, setPath] = React.useState('');
    const [mergeDialogOpened, setMergeDialogOpened] = React.useState(false)
    const {setFiles, files, apiKey, setApiKey, appUrl, setAppUrl} = React.useContext(DataContext);

    React.useEffect(() => {
        const search = new URLSearchParams(window.location.search);
        setPath(search.get('path') || '.');
    }, [])

    return (
        <>
            <div>
                <label>
                    App URL:
                    <input type="url" name="appUrl" onChange={e => setAppUrl(e.target.value)} value={appUrl} />
                </label>
                <label>
                    API Key:
                    <input type="text" name="apiKey" onChange={e => setApiKey(e.target.value)} value={apiKey}/>
                </label>
            </div>
            <hr/>
            <form>
                <label>
                    Path:
                    <input type="text" name="path" defaultValue={path}/>
                </label>
                <button type="submit">Go</button>
            </form>
            <Finder setFiles={setFiles} selectedFiles={files}/>
            {files.length > 1 && <div>
                <button onClick={() => setMergeDialogOpened(v => !v)}>Merge</button>
            </div>}
            <MergeDialog
                open={mergeDialogOpened}
                files={files}
                onClose={() => setMergeDialogOpened(v => !v)}
            />
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