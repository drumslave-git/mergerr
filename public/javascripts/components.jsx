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

const Button = ({onClick, children, className = '', ...props}) => {
    return <button onClick={onClick} type="button" className={"btn " + className} {...props}>{children}</button>
}

const ButtonPrimary = (props) => {
    return <Button {...props} className="btn-primary" />
}

const ButtonSecondary = (props) => {
    return <Button {...props} className="btn-secondary" />
}

const ButtonDanger = (props) => {
    return <Button {...props} className="btn-danger" />
}

const Preloader = ({message = 'Loading...'}) => {
    const {addToast, removeToast} = React.useContext(DataContext);
    React.useEffect(() => {
        const toast = {message, type: 'info'}
        addToast(toast)
        return () => {
            removeToast(toast)
        }
    }, [message])

    return (
        <div className="d-flex justify-content-center">
            <div className="spinner-border" role="status">
                <span className="visually-hidden">{message}</span>
            </div>
        </div>
    )
}

const Dialog = ({title, children, onClose, onAction}) => {
    const ref = React.useRef()

    React.useEffect(() => {
        const modal = new bootstrap.Modal(ref.current, {})
        modal.show()
        ref.current.addEventListener('hidden.bs.modal', () => {
            onClose && onClose()
        }, {once: true})
    }, [])

    return (
        <div
            className="modal modal-xl fade"
            ref={ref}
        >
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                        {onClose && <button type="button" className="btn-close"  data-bs-dismiss="modal" aria-label="Close"></button>}
                    </div>
                    <div className="modal-body">
                        {children}
                    </div>
                    <div className="modal-footer">
                        {onClose && <ButtonSecondary data-bs-dismiss="modal">Close</ButtonSecondary>}
                        {onAction && <ButtonPrimary onClick={onAction}>OK</ButtonPrimary>}
                    </div>
                </div>
            </div>
        </div>
    )
}

const MoviesList = ({filter = '', onClick}) => {
    const {appType} = React.useContext(DataContext);

    const [movies, setMovies] = React.useState([])
    const [filteredMovies, setFilteredMovies] = React.useState([])

    React.useEffect(() => {
        setMovies(null)
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
        if(movies) {
            setFilteredMovies(movies.filter(movie => movie.title.toLowerCase().includes(filter.toLowerCase())))
        }
    }, [movies, filter])

    if(!movies) {
        return <Preloader message="Loading movies..." />
    }

    if(movies.length === 0) {
        return <div>Nothing</div>
    }

    return (
        <div className="list-group" style={{height: '30vh', overflow: 'auto'}}>
            {filteredMovies.map(movie => (
                <button type="button" key={movie.id}
                        className="list-group-item list-group-item-action"
                        onClick={() => onClick(movie)}
                >{movie.title} ({movie.year})</button>
            ))}
        </div>
    )
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
        <ul className="list-group">
            {sources.map(source => (
                <li key={source} className="list-group-item">
                    {source}
                </li>
            ))}
        </ul>
        {!movie && (
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">Select target movie</h5>
                    <div className="input-group">
                        <div className="input-group-text">filter</div>
                        <input type="text" className="form-control" value={filter}
                               onChange={e => setFilter(e.target.value)} placeholder="quary"/>
                    </div>
                    <MoviesList onClick={onSelectedMovie} filter={filter}/>
                </div>
            </div>
        )}
        {movie && (
            <div>
                <strong>Target:</strong> {movie.path} - {movie.cleanTitle}
                <ButtonDanger onClick={onDropMovie}>Drop</ButtonDanger>
            </div>
        )}
    </div>
}