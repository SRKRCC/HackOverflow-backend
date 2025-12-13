import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function backup() {
  try {
    console.log('Starting backup process...');

    const teams = await prisma.team.findMany({
      include: {
        team_members: true,
        problem_statement: {
          select: {
            id: true,
          },
        },
        tasks: true,
      },
    });

    const problemStatements = await prisma.problemStatement.findMany({
      include: {
        Team: true,
      },
    });

    const teamsBackupData = {
      timestamp: new Date().toISOString(),
      teamCount: teams.length,
      memberCount: teams.reduce((sum, team) => sum + team.team_members.length, 0),
      teams,
    };

    const psBackupData = {
      timestamp: new Date().toISOString(),
      psCount: problemStatements.length,
      problemStatements,
    };

    const date = new Date().toISOString().split('T')[0];
    const teamsFilename = `backup-teams-${date}.json`;
    const psFilename = `backup-ps.json`;
    const teamsFilepath = path.join(process.cwd(), teamsFilename);
    const psFilepath = path.join(process.cwd(), psFilename);

    fs.writeFileSync(teamsFilepath, JSON.stringify(teamsBackupData, null, 2));
    fs.writeFileSync(psFilepath, JSON.stringify(psBackupData, null, 2));
    console.log(`Teams backup created: ${teamsFilename}`);
    console.log(`Problem statements backup created: ${psFilename}`);
    console.log(`Stats: ${teamsBackupData.teamCount} teams, ${teamsBackupData.memberCount} members, ${psBackupData.psCount} problem statements`);

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

      fs.copyFileSync(teamsFilepath, path.join(backupDir, teamsFilename));
      fs.copyFileSync(psFilepath, path.join(backupDir, psFilename));
      
      process.chdir(backupDir);
      execSync('git add .');
      execSync(`git commit -m "Backup: ${date} - ${teamsBackupData.teamCount} teams, ${teamsBackupData.memberCount} members, ${psBackupData.psCount} problem statements"`);
      execSync('git push');
      
      console.log('Backup pushed to GitHub successfully!');
    } else {
      console.log('Running locally - skipping git push');
      console.log(`Teams backup saved to: ${teamsFilepath}`);
      console.log(`Problem statements backup saved to: ${psFilepath}`);
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
