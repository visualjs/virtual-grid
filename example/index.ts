import { VirtualGrid } from '../src';

import './style.css';

const CONTAINER_WIDTH = 600;
const CONTAINER_HEIGHT = 450;

const rows = Array.from(Array(1000).keys());
const columns = Array.from(Array(100).keys());

function getRowHeight(index: number) {
    return Math.min(30 + index * 2, 60);
}

function getColumnWidth(index: number) {
    return 60 + index * 2;
}

(function () {

    // Make sure you have a container to  render into
    const container = document.createElement('div');

    container.className = 'virtual-grid';
    container.style.width = CONTAINER_WIDTH + 'px';
    container.style.height = CONTAINER_HEIGHT + 'px';

    document.body.appendChild(container);

    // Initialize our VirtualGrid
    var virtualGrid = new VirtualGrid(container, {
        width: CONTAINER_WIDTH,
        height: CONTAINER_HEIGHT,
        rowClassName: 'row',
        rowCount: rows.length,
        columnCount: columns.length,
        overscanRowCount: 10,
        overscanColumnCount: 2,
        scrollLeftOffset: 200,
        scrollToRowIndex: 10,
        rowHeight: getRowHeight,
        columnWidth: getColumnWidth,
        renderCell: ({ row, column, style }) => {
            return `<div class="cell" style="${style}">#${row},${column}</div>`;
        },
    });

})();
