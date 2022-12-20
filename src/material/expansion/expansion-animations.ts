/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {
  animate,
  AnimationTriggerMetadata,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

/**
 * Time and timing curve for expansion panel animations.
 *
 * 可展开面板动画的时间和时序曲线。
 *
 */
// Note: Keep this in sync with the Sass variable for the panel header animation.
export const EXPANSION_PANEL_ANIMATION_TIMING = '225ms cubic-bezier(0.4,0.0,0.2,1)';

/**
 * Animations used by the Material expansion panel.
 *
 * Material 可展开面板使用的动画。
 *
 * A bug in angular animation's `state` when ViewContainers are moved using ViewContainerRef.move()
 * causes the animation state of moved components to become `void` upon exit, and not update again
 * upon reentry into the DOM.  This can lead a to situation for the expansion panel where the state
 * of the panel is `expanded` or `collapsed` but the animation state is `void`.
 *
 * Angular 动画的 `state` 有一个 BUG：当使用 ViewContainerRef.move() 移动 ViewContainer 时，会导致被移动组件的动画状态在即将结束时变为 `void`，并且在重新进入 DOM 时不会再次更新。这会导致可展开面板出现一种情况：该面板的状态是 `expanded` 或 `collapsed`，但动画状态却是 `void`。
 *
 * To correctly handle animating to the next state, we animate between `void` and `collapsed` which
 * are defined to have the same styles. Since angular animates from the current styles to the
 * destination state's style definition, in situations where we are moving from `void`'s styles to
 * `collapsed` this acts a noop since no style values change.
 *
 * 为了正确处理到下一个状态的动画，我们在 `void` 和 `collapsed` 之间也设置了动画，并把它定义为具有相同的样式。由于在我们这个场景下 angular 的动画从当前样式到目标状态的样式定义是一样的，所以从 `void` 的样式移到 `collapsed` 属性时，这就什么也没做，因为样式值没有变化。
 *
 * In the case where angular's animation state is out of sync with the expansion panel's state, the
 * expansion panel being `expanded` and angular animations being `void`, the animation from the
 * `expanded`'s effective styles (though in a `void` animation state) to the collapsed state will
 * occur as expected.
 *
 * 如果 angular 的动画状态与可展开面板的状态不同步，那么展开的面板就会变为 `expanded`，而 Angular 动画是 `void`，从 `expanded` （虽然实际处于 `void` 动画状态）状态到已折叠状态的动画效果符合预期。
 *
 * Angular Bug: https://github.com/angular/angular/issues/18847
 *
 * Angular 的 BUG：https://github.com/angular/angular/issues/18847
 *
 * @docs-private
 */
export const matExpansionAnimations: {
  readonly indicatorRotate: AnimationTriggerMetadata;
  readonly bodyExpansion: AnimationTriggerMetadata;
} = {
  /** Animation that rotates the indicator arrow. */
  indicatorRotate: trigger('indicatorRotate', [
    state('collapsed, void', style({transform: 'rotate(0deg)'})),
    state('expanded', style({transform: 'rotate(180deg)'})),
    transition(
      'expanded <=> collapsed, void => collapsed',
      animate(EXPANSION_PANEL_ANIMATION_TIMING),
    ),
  ]),
  /** Animation that expands and collapses the panel content. */
  bodyExpansion: trigger('bodyExpansion', [
    state('collapsed, void', style({height: '0px', visibility: 'hidden'})),
    state('expanded', style({height: '*', visibility: 'visible'})),
    transition(
      'expanded <=> collapsed, void => collapsed',
      animate(EXPANSION_PANEL_ANIMATION_TIMING),
    ),
  ]),
};
