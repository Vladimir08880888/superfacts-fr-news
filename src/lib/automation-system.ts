import { FrenchNewsCollector } from './news-collector';
import { analytics } from './analytics-system';

export interface ScheduledTask {
  id: string;
  name: string;
  schedule: string; // Cron expression
  handler: () => Promise<void>;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  lastResult?: 'success' | 'error';
  lastError?: string;
  runCount: number;
  averageRunTime: number;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  duration: number;
  timestamp: string;
  error?: string;
  data?: any;
}

export class AutomationSystem {
  private tasks: Map<string, ScheduledTask> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;
  private taskHistory: TaskResult[] = [];
  private maxHistorySize = 1000;

  constructor() {
    this.initializeTasks();
    this.loadTaskHistory();
  }

  private initializeTasks() {
    // Collecte automatique des actualités toutes les 30 minutes
    this.addTask({
      id: 'news-collection',
      name: 'Collecte automatique des actualités',
      schedule: '*/30 * * * *', // Toutes les 30 minutes
      handler: this.collectNewsTask.bind(this),
      enabled: true,
      runCount: 0,
      averageRunTime: 0
    });

    // Nettoyage des anciennes données toutes les 6 heures
    this.addTask({
      id: 'data-cleanup',
      name: 'Nettoyage des données anciennes',
      schedule: '0 */6 * * *', // Toutes les 6 heures
      handler: this.cleanupDataTask.bind(this),
      enabled: true,
      runCount: 0,
      averageRunTime: 0
    });

    // Génération des rapports analytiques quotidiens
    this.addTask({
      id: 'daily-analytics',
      name: 'Rapport analytique quotidien',
      schedule: '0 2 * * *', // Tous les jours à 2h du matin
      handler: this.generateDailyAnalyticsTask.bind(this),
      enabled: true,
      runCount: 0,
      averageRunTime: 0
    });

    // Vérification de santé du système toutes les 15 minutes
    this.addTask({
      id: 'health-check',
      name: 'Vérification de santé du système',
      schedule: '*/15 * * * *', // Toutes les 15 minutes
      handler: this.systemHealthCheckTask.bind(this),
      enabled: true,
      runCount: 0,
      averageRunTime: 0
    });

    // Sauvegarde des données utilisateur toutes les heures
    this.addTask({
      id: 'backup-user-data',
      name: 'Sauvegarde des données utilisateur',
      schedule: '0 * * * *', // Toutes les heures
      handler: this.backupUserDataTask.bind(this),
      enabled: true,
      runCount: 0,
      averageRunTime: 0
    });

    // Optimisation des performances hebdomadaire
    this.addTask({
      id: 'weekly-optimization',
      name: 'Optimisation hebdomadaire des performances',
      schedule: '0 3 * * 0', // Tous les dimanches à 3h du matin
      handler: this.weeklyOptimizationTask.bind(this),
      enabled: true,
      runCount: 0,
      averageRunTime: 0
    });

    // Mise à jour des traductions manuelles mensuelles
    this.addTask({
      id: 'translation-update',
      name: 'Mise à jour des traductions',
      schedule: '0 4 1 * *', // Le 1er de chaque mois à 4h du matin
      handler: this.updateTranslationsTask.bind(this),
      enabled: false, // Désactivé par défaut
      runCount: 0,
      averageRunTime: 0
    });
  }

  // Gestion des tâches
  public addTask(task: ScheduledTask) {
    task.nextRun = this.calculateNextRun(task.schedule);
    this.tasks.set(task.id, task);
    this.saveTasksToStorage();
  }

  public removeTask(taskId: string) {
    this.stopTask(taskId);
    this.tasks.delete(taskId);
    this.saveTasksToStorage();
  }

  public enableTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = true;
      task.nextRun = this.calculateNextRun(task.schedule);
      this.saveTasksToStorage();
      
      if (this.isRunning) {
        this.scheduleTask(task);
      }
    }
  }

  public disableTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = false;
      this.stopTask(taskId);
      this.saveTasksToStorage();
    }
  }

  // Démarrage et arrêt du système
  public start() {
    if (this.isRunning) return;
    
    console.log('AutomationSystem: Démarrage du système d\\'automatisation');
    this.isRunning = true;
    
    // Planifier toutes les tâches activées
    this.tasks.forEach(task => {
      if (task.enabled) {
        this.scheduleTask(task);
      }
    });
    
    // Démarrer le monitoring des tâches
    this.startTaskMonitoring();
  }

  public stop() {
    if (!this.isRunning) return;
    
    console.log('AutomationSystem: Arrêt du système d\\'automatisation');
    this.isRunning = false;
    
    // Arrêter toutes les tâches
    this.intervals.forEach((interval, taskId) => {
      clearTimeout(interval);
    });
    this.intervals.clear();
  }

  private scheduleTask(task: ScheduledTask) {
    const now = new Date();
    const nextRun = new Date(task.nextRun || now);
    const delay = Math.max(0, nextRun.getTime() - now.getTime());
    
    const timeout = setTimeout(async () => {
      await this.runTask(task);
      
      // Reprogrammer la tâche si elle est toujours active
      if (task.enabled && this.isRunning) {
        task.nextRun = this.calculateNextRun(task.schedule);
        this.scheduleTask(task);
      }
    }, delay);
    
    this.intervals.set(task.id, timeout);
  }

  private stopTask(taskId: string) {
    const interval = this.intervals.get(taskId);
    if (interval) {
      clearTimeout(interval);
      this.intervals.delete(taskId);
    }
  }

  private async runTask(task: ScheduledTask): Promise<TaskResult> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();
    
    console.log(`AutomationSystem: Exécution de la tâche "${task.name}"`);
    
    let result: TaskResult;
    
    try {
      await task.handler();
      const duration = performance.now() - startTime;
      
      result = {
        taskId: task.id,
        success: true,
        duration,
        timestamp
      };
      
      task.lastResult = 'success';
      task.lastRun = timestamp;
      task.runCount++;
      task.averageRunTime = (task.averageRunTime * (task.runCount - 1) + duration) / task.runCount;
      
      console.log(`AutomationSystem: Tâche "${task.name}" terminée avec succès (${Math.round(duration)}ms)`);
      
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      result = {
        taskId: task.id,
        success: false,
        duration,
        timestamp,
        error: errorMessage
      };
      
      task.lastResult = 'error';
      task.lastError = errorMessage;
      task.lastRun = timestamp;
      
      console.error(`AutomationSystem: Erreur dans la tâche "${task.name}":`, error);
    }
    
    // Enregistrer le résultat
    this.taskHistory.push(result);
    if (this.taskHistory.length > this.maxHistorySize) {
      this.taskHistory = this.taskHistory.slice(-this.maxHistorySize);
    }
    
    this.saveTasksToStorage();
    this.saveTaskHistory();
    
    return result;
  }

  // Tâches automatisées
  private async collectNewsTask(): Promise<void> {
    const collector = new FrenchNewsCollector();
    const result = await collector.collectNews();
    
    if (result.newArticles > 0) {
      console.log(`AutomationSystem: Collecté ${result.newArticles} nouveaux articles`);
      
      // Enregistrer les métriques
      analytics.trackInteraction('click', 'auto_news_collection', '', {
        newArticles: result.newArticles,
        totalArticles: result.totalArticles,
        automated: true
      });
    }
  }

  private async cleanupDataTask(): Promise<void> {
    let cleaned = 0;
    
    // Nettoyer les données analytiques anciennes (>30 jours)
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Nettoyer l'historique des tâches ancien
    const oldHistorySize = this.taskHistory.length;
    this.taskHistory = this.taskHistory.filter(h => 
      new Date(h.timestamp) > cutoffDate
    );
    cleaned += oldHistorySize - this.taskHistory.length;
    
    // Nettoyer localStorage
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('sf_temp_') || key.startsWith('cache_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.timestamp && new Date(data.timestamp) < cutoffDate) {
              localStorage.removeItem(key);
              cleaned++;
            }
          } catch {
            // Si on ne peut pas parser, supprimer la clé
            localStorage.removeItem(key);
            cleaned++;
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage du localStorage:', error);
    }
    
    console.log(`AutomationSystem: Nettoyé ${cleaned} entrées de données anciennes`);
  }

  private async generateDailyAnalyticsTask(): Promise<void> {
    const metrics = analytics.getSystemMetrics();
    const report = {
      date: new Date().toISOString().split('T')[0],
      metrics,
      tasks: Array.from(this.tasks.values()).map(task => ({
        name: task.name,
        runCount: task.runCount,
        averageRunTime: task.averageRunTime,
        lastResult: task.lastResult
      }))
    };
    
    // Sauvegarder le rapport
    localStorage.setItem(`daily_report_${report.date}`, JSON.stringify(report));
    
    console.log('AutomationSystem: Rapport analytique quotidien généré');
  }

  private async systemHealthCheckTask(): Promise<void> {
    const healthChecks = await analytics.performHealthChecks();
    const unhealthyServices = healthChecks.filter(check => check.status === 'error');
    
    if (unhealthyServices.length > 0) {
      console.warn(`AutomationSystem: ${unhealthyServices.length} services non opérationnels détectés`);
      
      // Ici on pourrait envoyer des alertes
      // await this.sendHealthAlert(unhealthyServices);
    }
    
    // Sauvegarder les résultats
    localStorage.setItem('last_health_check', JSON.stringify({
      timestamp: new Date().toISOString(),
      results: healthChecks
    }));
  }

  private async backupUserDataTask(): Promise<void> {
    try {
      const userData = {
        userProfile: localStorage.getItem('superfacts_user_profile'),
        quickData: localStorage.getItem('superfacts_quick_data'),
        analytics: localStorage.getItem('sf_analytics_events'),
        timestamp: new Date().toISOString()
      };
      
      // Sauvegarder avec rotation (garder les 7 dernières)
      const backupKey = `backup_${new Date().getHours()}`;
      localStorage.setItem(backupKey, JSON.stringify(userData));
      
      console.log('AutomationSystem: Sauvegarde des données utilisateur effectuée');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }

  private async weeklyOptimizationTask(): Promise<void> {
    // Optimiser les données analytiques
    analytics.clearUserData(''); // Nettoyer les données anonymes
    
    // Compacter les données
    const userProfile = localStorage.getItem('superfacts_user_profile');
    if (userProfile) {
      try {
        const profile = JSON.parse(userProfile);
        // Limiter l'historique de lecture à 100 entrées
        if (profile.readingHistory && profile.readingHistory.length > 100) {
          profile.readingHistory = profile.readingHistory.slice(-100);
          localStorage.setItem('superfacts_user_profile', JSON.stringify(profile));
        }
      } catch (error) {
        console.error('Erreur lors de l\\'optimisation du profil utilisateur:', error);
      }
    }
    
    console.log('AutomationSystem: Optimisation hebdomadaire terminée');
  }

  private async updateTranslationsTask(): Promise<void> {
    // Cette tâche serait normalement connectée à un service de traduction
    // ou téléchargerait des fichiers de traduction mis à jour
    console.log('AutomationSystem: Mise à jour des traductions (placeholder)');
  }

  // Monitoring et rapport
  private startTaskMonitoring() {
    // Vérifier les tâches bloquées toutes les 5 minutes
    const monitoringInterval = setInterval(() => {
      this.checkStuckTasks();
    }, 5 * 60 * 1000);
    
    this.intervals.set('monitoring', monitoringInterval);
  }

  private checkStuckTasks() {
    const now = new Date();
    
    this.tasks.forEach(task => {
      if (task.enabled && task.nextRun) {
        const nextRun = new Date(task.nextRun);
        const delay = now.getTime() - nextRun.getTime();
        
        // Si une tâche devrait avoir été exécutée il y a plus de 10 minutes
        if (delay > 10 * 60 * 1000) {
          console.warn(`AutomationSystem: Tâche bloquée détectée: ${task.name}`);
          
          // Reprogrammer la tâche
          task.nextRun = this.calculateNextRun(task.schedule);
          this.stopTask(task.id);
          this.scheduleTask(task);
        }
      }
    });
  }

  // Utilitaires
  private calculateNextRun(cronExpression: string): string {
    // Implémentation simplifiée du cron
    // En production, utiliser une vraie librairie cron comme 'node-cron' ou 'cron-parser'
    const now = new Date();
    
    // Parse simple pour quelques patterns communs
    if (cronExpression === '*/30 * * * *') {
      // Toutes les 30 minutes
      const next = new Date(now);
      next.setMinutes(Math.floor(now.getMinutes() / 30) * 30 + 30, 0, 0);
      return next.toISOString();
    }
    
    if (cronExpression === '0 */6 * * *') {
      // Toutes les 6 heures
      const next = new Date(now);
      next.setHours(Math.floor(now.getHours() / 6) * 6 + 6, 0, 0, 0);
      return next.toISOString();
    }
    
    if (cronExpression === '0 2 * * *') {
      // Tous les jours à 2h
      const next = new Date(now);
      next.setDate(now.getDate() + (now.getHours() >= 2 ? 1 : 0));
      next.setHours(2, 0, 0, 0);
      return next.toISOString();
    }
    
    if (cronExpression === '*/15 * * * *') {
      // Toutes les 15 minutes
      const next = new Date(now);
      next.setMinutes(Math.floor(now.getMinutes() / 15) * 15 + 15, 0, 0);
      return next.toISOString();
    }
    
    if (cronExpression === '0 * * * *') {
      // Toutes les heures
      const next = new Date(now);
      next.setHours(now.getHours() + 1, 0, 0, 0);
      return next.toISOString();
    }
    
    // Par défaut, dans une heure
    const next = new Date(now.getTime() + 60 * 60 * 1000);
    return next.toISOString();
  }

  // Persistance
  private saveTasksToStorage() {
    try {
      const tasksData = Array.from(this.tasks.entries());
      localStorage.setItem('automation_tasks', JSON.stringify(tasksData));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des tâches:', error);
    }
  }

  private loadTasksFromStorage() {
    try {
      const stored = localStorage.getItem('automation_tasks');
      if (stored) {
        const tasksData = JSON.parse(stored);
        tasksData.forEach(([id, task]: [string, ScheduledTask]) => {
          this.tasks.set(id, task);
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
    }
  }

  private saveTaskHistory() {
    try {
      localStorage.setItem('automation_history', JSON.stringify(this.taskHistory));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\\'historique:', error);
    }
  }

  private loadTaskHistory() {
    try {
      const stored = localStorage.getItem('automation_history');
      if (stored) {
        this.taskHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\\'historique:', error);
    }
  }

  // API publique
  public getTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  public getTask(taskId: string): ScheduledTask | undefined {
    return this.tasks.get(taskId);
  }

  public getTaskHistory(taskId?: string): TaskResult[] {
    if (taskId) {
      return this.taskHistory.filter(result => result.taskId === taskId);
    }
    return this.taskHistory;
  }

  public getSystemStatus() {
    const tasks = Array.from(this.tasks.values());
    const totalTasks = tasks.length;
    const enabledTasks = tasks.filter(t => t.enabled).length;
    const errorTasks = tasks.filter(t => t.lastResult === 'error').length;
    
    const recentHistory = this.taskHistory.slice(-100);
    const successRate = recentHistory.length > 0 
      ? (recentHistory.filter(r => r.success).length / recentHistory.length) * 100
      : 100;
    
    return {
      isRunning: this.isRunning,
      totalTasks,
      enabledTasks,
      errorTasks,
      successRate: Math.round(successRate),
      lastActivity: this.taskHistory[this.taskHistory.length - 1]?.timestamp,
      uptime: this.isRunning ? Date.now() - (Date.now() - 24 * 60 * 60 * 1000) : 0 // Placeholder
    };
  }
}

// Instance singleton
export const automationSystem = new AutomationSystem();
