import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { BottomNav } from '../bottom-nav/bottom-nav';
import { BranchService } from '../../services/branch';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule, BottomNav, CommonModule],
  templateUrl: './main-layout.html',
})
export class MainLayout implements OnInit {
  private branchService = inject(BranchService);
  authService = inject(AuthService);

  ngOnInit() {
    this.branchService.loadBranches();
  }

  getBranchName(id: string | null | undefined): string {
    if (!id) return 'Sin sede';
    const branch = this.branchService.branches().find(b => b.id === id);
    return branch ? branch.name : 'Sede Desconocida';
  }
}
