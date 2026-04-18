import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
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
  public branchService = inject(BranchService);
  private router = inject(Router);
  public authService = inject(AuthService);

  isDropdownOpen = signal(false);

  ngOnInit() {
    this.branchService.loadBranches();
  }

  getBranchName(id: string | null | undefined): string {
    if (!id) return 'Todas las Sedes';
    const branch = this.branchService.branches().find(b => b.id === id);
    return branch ? branch.name : 'Sede Desconocida';
  }

  toggleDropdown() {
    if (this.authService.userRole() === 'SUPER_ADMIN') {
      this.isDropdownOpen.update(v => !v);
    }
  }

  selectBranch(id: string | null) {
    this.branchService.setActiveBranch(id);
    this.isDropdownOpen.set(false);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }
}
