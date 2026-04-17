import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNav } from '../bottom-nav/bottom-nav';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, BottomNav],
  templateUrl: './main-layout.html',
})
export class MainLayout {}
