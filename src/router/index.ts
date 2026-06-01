import { createRouter, createWebHistory, type RouteLocationNormalized, type RouteRecordRaw } from 'vue-router'

import MainLayout from '@/layouts/MainLayout.vue'
import AdminPanelView from '@/views/AdminPanelView.vue'
import AdminUsersView from '@/views/AdminUsersView.vue'
import DirectionsView from '@/views/DirectionsView.vue'
import FavoritesView from '@/views/FavoritesView.vue'
import LoginView from '@/views/LoginView.vue'
import ProfileView from '@/views/ProfileView.vue'
import RecommendationsView from '@/views/RecommendationsView.vue'
import RegisterView from '@/views/RegisterView.vue'
import SubjectAreaView from '@/views/SubjectAreaView.vue'
import { useAuthStore } from '@/stores/auth'
import { i18n } from '@/i18n'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      publicOnly: true,
      titleKey: 'routes.login',
    },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: {
      publicOnly: true,
      titleKey: 'routes.register',
    },
  },
  {
    path: '/',
    component: MainLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        redirect: '/directions',
      },
      {
        path: 'directions',
        name: 'directions',
        component: DirectionsView,
        meta: {
          titleKey: 'routes.directions',
        },
      },
      {
        path: 'subject-area',
        name: 'subject-area',
        component: SubjectAreaView,
        meta: {
          titleKey: 'routes.subjectArea',
        },
      },
      {
        path: 'recommendations',
        name: 'recommendations',
        component: RecommendationsView,
        meta: {
          titleKey: 'routes.recommendations',
        },
      },
      {
        path: 'favorites',
        name: 'favorites',
        component: FavoritesView,
        meta: {
          titleKey: 'routes.favorites',
        },
      },
      {
        path: 'profile',
        name: 'profile',
        component: ProfileView,
        meta: {
          titleKey: 'routes.profile',
        },
      },
      {
        path: 'admin',
        name: 'admin-panel',
        component: AdminPanelView,
        meta: {
          requiresAdmin: true,
          titleKey: 'routes.admin',
        },
      },
      {
        path: 'admin/users',
        name: 'admin-users',
        component: AdminUsersView,
        meta: {
          requiresAdmin: true,
          titleKey: 'routes.users',
        },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

function resolveRedirect(to: RouteLocationNormalized): string {
  const redirect = to.query.redirect

  if (typeof redirect !== 'string' || !redirect.startsWith('/')) {
    return '/directions'
  }

  if (redirect.startsWith('/login') || redirect.startsWith('/register')) {
    return '/directions'
  }

  return redirect
}

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.loadCurrentUser()

  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth === true)
  const requiresAdmin = to.matched.some((route) => route.meta.requiresAdmin === true)

  if (requiresAuth && !auth.isAuthenticated.value) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (requiresAdmin && !auth.isAdmin.value) {
    return {
      name: 'directions',
    }
  }

  if (to.meta.publicOnly === true && auth.isAuthenticated.value) {
    return resolveRedirect(to)
  }

  return true
})

router.afterEach((to) => {
  document.title = typeof to.meta.titleKey === 'string' ? `${i18n.global.t(to.meta.titleKey)} | Scinside` : 'Scinside'
})

export default router
