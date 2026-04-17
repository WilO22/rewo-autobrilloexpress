import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNav } from '../bottom-nav/bottom-nav';
import { BranchService } from '../../services/branch';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, BottomNav],
  templateUrl: './main-layout.html',
})
export class MainLayout implements OnInit {
  private branchService = inject(BranchService);

  ngOnInit() {
    this.branchService.loadBranches();
  }
}
