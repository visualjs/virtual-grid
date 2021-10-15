/**
 * @jest-environment jsdom
 */

import { VirtualGrid, GridOptions } from "../src";
import { CellInfo } from "../src/types";

const HEIGHT = 100;
const WIDTH = 200;
const ROW_HEIGHT = 10;
const COLUMN_WIDTH = 20;

describe('VirtualGrid', () => {
    let container: HTMLDivElement;

    function renderCell({ style, row, column }: CellInfo) {
        return `<div class="cell" style="${style}">r${row}, c${column}</div>`;
    }

    function render(container: HTMLDivElement, options?: Partial<GridOptions>) {
        return new VirtualGrid(container, {
            width: WIDTH,
            height: HEIGHT,
            rowClassName: 'row',
            overscanColumnCount: 0,
            overscanRowCount: 0,
            rowHeight: ROW_HEIGHT,
            columnWidth: COLUMN_WIDTH,
            rowCount: 500,
            columnCount: 100,
            renderCell: renderCell,
            ...options,
        });
    }

    beforeEach(() => {
        container = document.createElement('div');
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation(
            (cb: FrameRequestCallback): number => { cb(0); return 0; }
        );
    });

    afterEach(() => {
        (window.requestAnimationFrame as any).mockRestore();
    });

    describe('number of rendered children', () => {

        it('renders enough children to fill the view', () => {
            render(container);

            expect(container.querySelectorAll('.row')).toHaveLength(HEIGHT / ROW_HEIGHT);
            expect(container.querySelectorAll('.cell')).toHaveLength((HEIGHT / ROW_HEIGHT) * (WIDTH / COLUMN_WIDTH));
        });

        it('does not render more children than available if the list is not filled', () => {
            render(container, { rowCount: 5, columnCount: 10 });

            expect(container.querySelectorAll('.row')).toHaveLength(5);
            expect(container.querySelectorAll('.cell')).toHaveLength(5 * 10);
        });

        it('handles dynamically updating the number of items', () => {
            for (let rowCount = 0; rowCount < 5; rowCount++) {
                const grid = render(container, { rowCount });
                expect(container.querySelectorAll('.row')).toHaveLength(rowCount);
                grid.destroy();
            }
        });
    });


    /** Test scrolling via initial props */
    describe('scrollToIndex', () => {
        it('scrolls to the left top', () => {
            render(container, { scrollToRowIndex: 0, scrollToColumnIndex: 0 });

            expect(container.textContent).toContain('r0, c0');
        });

        it('scrolls to the middle', () => {
            render(container, { scrollToRowIndex: 49, scrollToColumnIndex: 50 });

            expect(container.textContent).toContain('r49, c50');
        });

        it('scrolls to the correct position for :scrollToRowAlignment "start"', () => {
            render(container, {
                scrollToRowAlignment: 'start',
                scrollToRowIndex: 49,
            });

            // 100 items * 10 item height = 1,000 total item height; 10 items can be visible at a time.
            expect(container.textContent).toContain('r49, c0');
            expect(container.textContent).toContain('r58, c0');
        });

        it('scrolls to the correct position for :scrollToRowAlignment "end"', () => {
            render(container, {
                scrollToRowAlignment: 'end',
                scrollToRowIndex: 49,
            });

            // 100 items * 10 item height = 1,000 total item height; 10 items can be visible at a time.
            expect(container.textContent).toContain('r40, c0');
            expect(container.textContent).toContain('r49, c0');
        });

        it('scrolls to the correct position for :scrollToRowAlignment "center"', () => {
            render(container, {
                scrollToRowAlignment: 'center',
                scrollToRowIndex: 49,
            });

            // 100 items * 10 item height = 1,000 total item height; 11 items can be visible at a time (the first and last item are only partially visible)
            expect(container.textContent).toContain('r44, c0');
            expect(container.textContent).toContain('r54, c0');
        });
    });
});
