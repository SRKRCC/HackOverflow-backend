import { PrismaClient } from '../lib/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  // Create Problem Statements
  const ps1 = await prisma.problemStatement.create({
    data: {
      title: 'AI-Powered Chatbot',
      description: 'Build a chatbot using AI for customer support.',
      category: 'AI/ML',
    },
  });

  const ps2 = await prisma.problemStatement.create({
    data: {
      title: 'Sustainable Energy App',
      description: 'Develop an app to track and optimize energy usage.',
      category: 'Sustainability',
    },
  });

  // Create Teams
  const team1 = await prisma.team.create({
    data: {
      title: 'Team Alpha',
      ps_id: ps1.id,
      gallery_images: ['image1.jpg', 'image2.jpg'],
    },
  });

  const team2 = await prisma.team.create({
    data: {
      title: 'Team Beta',
      ps_id: ps2.id,
      gallery_images: ['image3.jpg'],
    },
  });

  const team3 = await prisma.team.create({
    data: {
      title: 'Team Gamma',
      ps_id: ps1.id,
      gallery_images: [],
    },
  });

  // Create Tasks for Teams
  await prisma.task.createMany({
    data: [
      { title: 'Setup Project', description: 'Initialize the project structure.', round_num: 1, points: 10, teamId: team1.id },
      { title: 'Implement Core Feature', description: 'Build the main functionality.', round_num: 2, points: 20, teamId: team1.id },
      { title: 'Testing', description: 'Write and run tests.', round_num: 3, points: 15, teamId: team1.id },
      { title: 'Setup Project', description: 'Initialize the project structure.', round_num: 1, points: 10, teamId: team2.id },
      { title: 'UI Design', description: 'Design the user interface.', round_num: 2, points: 25, teamId: team2.id },
      { title: 'Deployment', description: 'Deploy the app.', round_num: 3, points: 0, teamId: team2.id }, // Edge case: zero points
      // Team Gamma with no tasks (edge case)
    ],
  });

  // Create Members (optional)
  await prisma.member.createMany({
    data: [
      { name: 'Alice', email: 'alice@example.com', phone_number: '1234567890', college_name: 'College A', teamId: team1.id },
      { name: 'Bob', email: 'bob@example.com', phone_number: '0987654321', college_name: 'College B', teamId: team2.id },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
