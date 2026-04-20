import { Component, inject, OnInit, signal, effect, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { BottomNav } from '../bottom-nav/bottom-nav';
import { BranchState } from '../../services/branch.state';
import { ThemeService } from '../../services/theme';
import { Identity } from '../../services/auth';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ThemeSelector } from '../../components/ui/theme-selector';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterModule, BottomNav, CommonModule, ThemeSelector],
  templateUrl: './main-layout.html',
})
export class MainLayout implements OnInit {
  public branchState = inject(BranchState);
  private router = inject(Router);
  public authService = inject(Identity);
  private themeService = inject(ThemeService);
  isDropdownOpen = signal(false);

  ngOnInit(): void {}

  toggleDropdown() {
    if (this.authService.userRole() === 'SUPER_ADMIN') {
      this.isDropdownOpen.update(v => !v);
    }
  }

  selectBranch(id: string | null) {
    this.branchState.setActiveBranch(id);
    this.isDropdownOpen.set(false);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }
}
