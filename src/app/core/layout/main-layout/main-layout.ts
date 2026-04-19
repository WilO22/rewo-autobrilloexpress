import { Component, inject, OnInit, signal, effect, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { BottomNav } from '../bottom-nav/bottom-nav';
import { Branches } from '../../services/branch';
import { Identity } from '../../services/auth';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule, BottomNav, CommonModule],
  templateUrl: './main-layout.html',
})
export class MainLayout implements OnInit {
  public branchService = inject(Branches);
  private router = inject(Router);
  public authService = inject(Identity);
  private platformId = inject(PLATFORM_ID);

  isDropdownOpen = signal(false);

  constructor() {
    // Efecto reactivo Senior para cambiar el color de la App según la sede
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const theme = this.branchService.currentTheme();
        const style = document.documentElement.style;
        style.setProperty('--dynamic-accent', theme.accent);
        style.setProperty('--dynamic-glow', theme.glow);
        style.setProperty('--dynamic-border', theme.border);
      }
    });
  }

  ngOnInit() {
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
