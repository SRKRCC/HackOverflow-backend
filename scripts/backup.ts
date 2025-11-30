import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

interface BackupData {
  timestamp: string;
  teamCount: number;
  memberCount: number;
  psCount: number;
  teams: any[];
  problemStatements: any[];
}

async function backup() {
  try {
    console.log('Starting backup process...');

    // Fetch all data
    const teams = await prisma.team.findMany({
      include: {
        team_members: true,
        problem_statement: true,
        tasks: true,
      },
    });

    const problemStatements = await prisma.problemStatement.findMany({
      include: {
        Team: true,
      },
    });

    // Prepare backup data
    const backupData: BackupData = {
      timestamp: new Date().toISOString(),
      teamCount: teams.length,
      memberCount: teams.reduce((sum, team) => sum + team.team_members.length, 0),
      psCount: problemStatements.length,
      teams,
      problemStatements,
    };

    // Create filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `backup-${date}.json`;
    const filepath = path.join(process.cwd(), filename);

    // Write JSON file
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    console.log(`Backup created: ${filename}`);
    console.log(`Stats: ${backupData.teamCount} teams, ${backupData.memberCount} members`);

    // Git operations if running in CI
    if (process.env.CI) {
      console.log('Pushing to backup repository...');
      
      const backupRepo = process.env.BACKUP_REPO || 'https://github.com/SRKRCC/ho-data-backups.git';
      const token = process.env.BACKUP_TOKEN;
      
      if (!token) {
        throw new Error('BACKUP_TOKEN environment variable is not set');
      }

      execSync('git config --global user.name "SRKRCC"');
      execSync('git config --global user.email "srkrcodingclub@gmail.com"');

      const backupDir = 'backup-repo';
      
      if (!fs.existsSync(backupDir)) {
        const repoWithToken = backupRepo.replace('https://', `https://${token}@`);
        execSync(`git clone ${repoWithToken} ${backupDir}`);
      }

      fs.copyFileSync(filepath, path.join(backupDir, filename));
      
      process.chdir(backupDir);
      execSync('git add .');
      execSync(`git commit -m "Backup: ${date} - ${backupData.teamCount} teams, ${backupData.memberCount} members"`);
      execSync('git push');
      
      console.log('Backup pushed to GitHub successfully!');
    } else {
      console.log('Running locally - skipping git push');
      console.log(`Backup saved to: ${filepath}`);
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Backup failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

backup();
