const Main = () => {
    const {apiKey, setApiKey, appUrl, setAppUrl, saveConfig, appType, setAppType, queue, target, setTarget, mergeVideos, toasts, ffmpegLogs, setFfmpegLogs, ffmpegStatus} = React.useContext(DataContext);

    const onMerge = React.useCallback((e) => {
        e.preventDefault()
        setTarget(e.target.dataset.downloadid)
    }, [queue])

    const mergeTarget = React.useMemo(() => queue && target && queue.find(item => item.downloadId === target), [queue, target])

    return (
        <>
            <nav className="navbar sticky-top bg-body-tertiary">
                <div className="container-fluid">
                    <a className="navbar-brand" href="/">Mergerr</a>
                    <div className="row g-2 align-items-center">
                        <div className="col-auto">
                            <div className="input-group">
                                <div className="input-group-text">app</div>
                                <select name="appType" className="form-select" id="appType"
                                        onChange={e => setAppType(e.target.value)} value={appType}>
                                    {APPS_TYPES.map(app => <option key={app} value={app}>{app}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="col-auto">
                            <div className="input-group">
                                <div className="input-group-text">url</div>
                                <input type="url" className="form-control" name="appUrl" id="appUrl"
                                       onChange={e => setAppUrl(e.target.value)} value={appUrl}/>
                            </div>
                        </div>
                        <div className="col-auto">
                            <div className="input-group">
                                <div className="input-group-text">api key</div>
                                <input type="password" className="form-control" name="apiKey" id="apiKey"
                                       onChange={e => setApiKey(e.target.value)} value={apiKey}/>
                            </div>
                        </div>
                        <div className="col-auto">
                            <ButtonPrimary onClick={() => saveConfig()}>Save</ButtonPrimary>
                        </div>
                    </div>
                </div>
            </nav>
            <div className="container">
                {
                    !queue &&
                    <Preloader message="Loading queue..."/>
                }
                {queue && queue.length === 0 && <div>No items in queue</div>}
                <ul className="list-group">
                    {queue && queue.map(item => (
                        <li key={item.downloadId} className="list-group-item">
                            <div className="input-group">
                                <div className="input-group-text">{item.title}</div>
                                <ButtonPrimary data-downloadid={item.downloadId}
                                               onClick={onMerge}>Merge</ButtonPrimary>
                            </div>
                            <ul className="list-group">
                                {item.manualImport.map(manual => (
                                    <li key={manual.id} className="list-group-item">
                                        {manual.relativePath}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            </div>
            {target && <Dialog title={`Merge: ${mergeTarget.title}`} onClose={() => setTarget(null)}
                               onAction={mergeVideos}>
                <MergeInfo/>
            </Dialog>}
            {ffmpegLogs && <Dialog title={`Merge is running`} onClose={ffmpegStatus === 'idle' ? () => setFfmpegLogs('') : undefined} >
               <pre>{ffmpegLogs}</pre>
            </Dialog>}
            <div className="toast-container position-fixed bottom-0 end-0 p-3">
                {toasts.map(toast => (
                    <div key={toast.message} className={`toast show align-items-center text-bg-${toast.type} border-0`} role="alert" aria-live="assertive" aria-atomic="true">
                        <div className="toast-body">
                            {toast.message}
                        </div>
                    </div>
                ))}
            </div>
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

ReactDOM.render(<App/>, document.getElementById('app-root'));