import {Component} from '@angular/core';
import {CdkDragDrop, moveItemInArray, CdkDrag} from '@angular/cdk/drag-drop';

/**
 * @title Drag&Drop sort predicate
 */
@Component({
  selector: 'cdk-drag-drop-sort-predicate-example',
  templateUrl: 'cdk-drag-drop-sort-predicate-example.html',
  styleUrls: ['cdk-drag-drop-sort-predicate-example.css'],
})
export class CdkDragDropSortPredicateExample {
  numbers = [1, 2, 3, 4, 5, 6, 7, 8];

  drop(event: CdkDragDrop<unknown>) {
    moveItemInArray(this.numbers, event.previousIndex, event.currentIndex);
  }

  /**
   * Predicate function that only allows even numbers to be
   * sorted into even indices and odd numbers at odd indices.
   *
   * 一个谓词函数，只允许将偶数排序到偶数索引和奇数索引处的奇数。
   *
   */
  sortPredicate(index: number, item: CdkDrag<number>) {
    return (index + 1) % 2 === item.data % 2;
  }
}
