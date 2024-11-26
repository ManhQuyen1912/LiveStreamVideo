async function loadRecordings(){
    const container = document.getElementById('recordings-container');

    try {
        const response = await fetch('/api/recordings');
        const data = await response.json();
        container.innerHTML = '';
        const createTree = (node, parentElement) => {
            for (const key in node) {
                if (key === 'files'){
                    const grid = document.createElement('div');
                    grid.className = 'recording-grid';
                    node[key].forEach(file=>{
                        const videoWrapper = document.createElement('div');
                        videoWrapper.className = 'recording-item';

                        const videoLink = document.createElement('a');
                        videoLink.href = `/new_recordings/${file}`;
                        videoLink.textContent = file;
                        videoLink.target = '_blank';
                        videoLink.className = 'recording-link';

                        const videoElement = document.createElement('video');
                        videoElement.controls = true;
                        videoElement.width = 320;
                        videoElement.height = 240;
                        videoElement.src = `new_recordings/${file}`;
                        videoElement.className = 'recording-video';

                        videoWrapper.append(videoElement,videoLink);
                        grid.appendChild(videoWrapper);
                    });
                    parentElement.appendChild(grid);
                } else {
                    const folder = document.createElement('details');
                    folder.className = 'folder';
                    const summary = document.createElement('summary');
                    summary.textContent = key;
                    summary.className = 'folder-summary'
                    folder.appendChild(summary);

                    const subContainer = document.createElement('div');
                    subContainer.className = 'folder-content';
                    folder.appendChild(subContainer);

                    parentElement.appendChild(folder);
                    createTree(node[key],subContainer);
                }
            }
        };
        const root = document.createElement('div');
        createTree(data,root);
        container.appendChild(root);
    } catch (error){
        console.log('Error loading recordings: ',error);
        container.innerHTML = '<p>Failed to load recordings.</p>'
    }
}
window.onload = loadRecordings;