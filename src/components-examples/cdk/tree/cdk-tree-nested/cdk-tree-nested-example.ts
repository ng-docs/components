import {Component} from '@angular/core';
import {ArrayDataSource} from '@angular/cdk/collections';
import {NestedTreeControl, CdkTreeModule} from '@angular/cdk/tree';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';

/**
 * Food data with nested structure.
 * Each node has a name and an optional list of children.
 *
 * 具有嵌套结构的食物数据。每个节点都有一个名称和一个可选的子节点列表。
 *
 */
interface FoodNode {
  name: string;
  children?: FoodNode[];
}

const TREE_DATA: FoodNode[] = [
  {
    name: 'Fruit',
    children: [{name: 'Apple'}, {name: 'Banana'}, {name: 'Fruit loops'}],
  },
  {
    name: 'Vegetables',
    children: [
      {
        name: 'Green',
        children: [{name: 'Broccoli'}, {name: 'Brussels sprouts'}],
      },
      {
        name: 'Orange',
        children: [{name: 'Pumpkins'}, {name: 'Carrots'}],
      },
    ],
  },
];

/**
 * @title Tree with nested nodes
 */
@Component({
  selector: 'cdk-tree-nested-example',
  templateUrl: 'cdk-tree-nested-example.html',
  styleUrls: ['cdk-tree-nested-example.css'],
  standalone: true,
  imports: [CdkTreeModule, MatButtonModule, MatIconModule],
})
export class CdkTreeNestedExample {
  treeControl = new NestedTreeControl<FoodNode>(node => node.children);
  dataSource = new ArrayDataSource(TREE_DATA);

  hasChild = (_: number, node: FoodNode) => !!node.children && node.children.length > 0;
}
