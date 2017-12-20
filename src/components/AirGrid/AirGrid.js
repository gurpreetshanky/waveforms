// @flow
import React, { PureComponent } from 'react';

import {
  COLORS,
  DEFAULT_WAVEFORM_SIZE,
  DEFAULT_WAVEFORM_NUM_OF_CYCLES,
  DEFAULT_WAVEFORM_AMPLITUDE,
  WAVEFORM_ASPECT_RATIO,
} from '../../constants';
import { range } from '../../utils';
import { getPositionAtPointRelativeToAxis } from '../../helpers/waveform.helpers';

import Canvas from '../Canvas';

import { getDimensions } from './AirGrid.helpers';

import type { WaveformShape } from '../../types';

const DEFAULT_COLS = 8;
const DEFAULT_ROWS = DEFAULT_COLS * WAVEFORM_ASPECT_RATIO;

type Props = {
  width: number,
  height: number,
  numOfRows: number,
  numOfCols: number,
  waveformShape: WaveformShape,
  waveformFrequency: number,
  waveformAmplitude: number,
  waveformProgress: number,
};

class AirGrid extends PureComponent<Props> {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  static defaultProps = {
    width: DEFAULT_WAVEFORM_SIZE,
    height: DEFAULT_WAVEFORM_SIZE * WAVEFORM_ASPECT_RATIO,
    numOfRows: DEFAULT_ROWS,
    numOfCols: DEFAULT_COLS,
    waveformShape: 'sine',
    waveformFrequency: DEFAULT_WAVEFORM_NUM_OF_CYCLES,
    waveformAmplitude: DEFAULT_WAVEFORM_AMPLITUDE,
  };

  componentDidUpdate() {
    const {
      width,
      height,
      numOfRows,
      numOfCols,
      waveformFrequency,
      waveformShape,
      waveformAmplitude,
      waveformProgress,
    } = this.props;

    const { colWidth, rowHeight } = getDimensions(
      width,
      height,
      numOfRows,
      numOfCols
    );

    const particleRadius = Math.min(colWidth, rowHeight) * 0.3;

    const sidePadding = colWidth;
    const topBottomPadding = rowHeight;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    range(0, numOfCols - 1).map(columnNum => {
      const wavePosition = this.getCellDisplacement(columnNum);

      return range(0, numOfRows - 1).map(rowNum => {
        // We want to offset each molecule by half of the row/column size, so that
        // the molecules sit in the center of the cell (rather than in the top
        // left corner)
        const yCenterOffset = rowHeight / 2;
        const xCenterOffset = colWidth / 2;

        // The `y` position is simple since cells don't move up and down.
        // Put it in the right cell, move it to the center of the cell, and
        // add the padding amount (see jsdoc of `getDimensions` in the helper
        // file)
        const yInPixels = rowNum * rowHeight + yCenterOffset + topBottomPadding;

        // `x` is a bit more complicated since it moves side-to-side depending
        // on the offset (and the column). Start by getting the 'baseline'
        // position.
        const xBaselineInPixels =
          columnNum * colWidth + xCenterOffset + sidePadding;

        // Each molecule can move +/- by the column width (less, if the
        // amplitude is less than 1). This
        const xInPixels = xBaselineInPixels + wavePosition * colWidth;

        this.ctx.beginPath();
        this.ctx.arc(xInPixels, yInPixels, particleRadius, 0, 2 * Math.PI);
        this.ctx.fill();
      });
    });
  }

  getCellDisplacement = columnNum => {
    // Each cell will translate from side to side. The columns are staggered,
    // to represent how a wave moves through space.
    const {
      numOfCols,
      waveformShape,
      waveformFrequency,
      waveformAmplitude,
      waveformProgress,
    } = this.props;

    // if every column operated the same way, we could simply use `progress`,
    // but we want to stagger them baed on their frequency.
    // Let's assume that the total grid represents 1 second (same as waveform).
    // Then, we can get the progress through the waveform by adding the number
    // of milliseconds to the current offset
    let columnOffset = columnNum / numOfCols;

    // The effect is a little extreme, so let's reduce the influence of the
    // columnOffset.

    const progress = ((waveformProgress - columnOffset) * 100) % 100;

    return getPositionAtPointRelativeToAxis(
      waveformShape,
      waveformFrequency,
      waveformAmplitude,
      progress
    );
  };

  captureRefs = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    this.canvas = canvas;
    this.ctx = ctx;
  };

  render() {
    const {
      width,
      height,
      numOfRows,
      numOfCols,
      waveformFrequency,
      waveformShape,
      waveformAmplitude,
      waveformProgress,
    } = this.props;

    const {
      colWidth,
      rowHeight,
      widthWithPadding,
      heightWithPadding,
    } = getDimensions(width, height, numOfRows, numOfCols);

    // We want to allow our canvas to show a bit of overflow (if the molecules
    // bounce out of the available space). So the width/height will be a bit
    // larger. We want to "inset" it so that the primary content area is still
    // where you'd expect (we're essentially just adding a 1 row/column buffer
    // around each edge, and then moving it back to center it)
    const topBottomPadding = rowHeight;
    const sidePadding = colWidth;

    return (
      <Canvas
        style={{ marginTop: -topBottomPadding, marginLeft: -sidePadding }}
        width={widthWithPadding}
        height={heightWithPadding}
        innerRef={this.captureRefs}
      />
    );
  }
}

export default AirGrid;