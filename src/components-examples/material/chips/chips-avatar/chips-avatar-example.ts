import {Component} from '@angular/core';
import {MatChipsModule} from '@angular/material/chips';

/**
 * @title Chips avatar
 *
 * 纸片头像
 *
 * @description
 *
 * An avatar inside a chip
 *
 * 纸片内的头像
 *
 */
@Component({
  selector: 'chips-avatar-example',
  templateUrl: 'chips-avatar-example.html',
  styleUrls: ['chips-avatar-example.css'],
  standalone: true,
  imports: [MatChipsModule],
})
export class ChipsAvatarExample {}
