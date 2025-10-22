import { PrismaClient } from "../lib/generated/prisma/index.js";
import { generatePasswordHash } from "../src/utils/jwtService.js";

const prisma = new PrismaClient();

async function seed() {
  console.log("Starting database seeding...");

  // Clear existing data
  await prisma.member.deleteMany();
  await prisma.task.deleteMany();
  await prisma.team.deleteMany();
  await prisma.problemStatement.deleteMany();
  await prisma.admin.deleteMany();

  const ps1 = await prisma.problemStatement.create({
    data: {
      psId: "HO2K25001",
      title: "AI-powered Crop Monitoring",
      description: "Build an AI system to detect crop diseases from images.",
      category: "Agriculture",
      tags: ["AI", "Machine Learning", "Agriculture"],
    },
  });

  const ps2 = await prisma.problemStatement.create({
    data: {
      psId: "HO2K25002",
      title: "Smart Waste Management",
      description: "IoT-based system for tracking and managing waste bins.",
      category: "Environment",
      tags: ["IoT", "Environment", "Sustainability"],
    },
  });

  const ps3 = await prisma.problemStatement.create({
    data: {
      psId: "HO2K25003",
      title: "Energy Optimization in Smart Homes",
      description: "Develop a system to optimize electricity usage in smart homes.",
      category: "Energy",
      tags: ["Smart Home", "Energy", "IoT"],
    },
  });

  const ps4 = await prisma.problemStatement.create({
    data: {
      psId: "HO2K25004",
      title: "AI Tutor for Students",
      description: "An AI-powered tutor to help students with personalized learning.",
      category: "Education",
      tags: ["AI", "Education", "Personalization"],
    },
  });

  const ps5 = await prisma.problemStatement.create({
    data: {
      psId: "HO2K25005",
      title: "Flood Prediction System",
      description: "Develop an ML-based flood prediction and alerting system.",
      category: "Disaster Management",
      tags: ["Machine Learning", "Disaster Management", "Environment"],
    },
  });

  const team1 = await prisma.team.create({
    data: {
      scc_id: "SCC001",
      scc_password: await generatePasswordHash("pass123"),
      title: "Green Farmers",
      ps_id: ps1.id,
      gallery_images: ["https://example.com/img1.png"],
    },
  });

  const team2 = await prisma.team.create({
    data: {
      scc_id: "SCC002",
      scc_password: await generatePasswordHash("pass456"),
      title: "Eco Warriors",
      ps_id: ps2.id,
      gallery_images: ["https://example.com/img2.png"],
      
    },
  });

  const team3 = await prisma.team.create({
    data: {
      scc_id: "SCC003",
      scc_password: await generatePasswordHash("pass789"),
      title: "Power Savers",
      ps_id: ps3.id,
      gallery_images: ["https://example.com/img3.png"],
    },
  });

  const team4 = await prisma.team.create({
    data: {
      scc_id: "SCC004",
      scc_password: await generatePasswordHash("pass321"),
      title: "AI Gurus",
      ps_id: ps4.id,
      gallery_images: ["https://example.com/img4.png"],
    },
  });

  const team5 = await prisma.team.create({
    data: {
      scc_id: "SCC005",
      scc_password: await generatePasswordHash("pass654"),
      title: "Flood Fighters",
      ps_id: ps5.id,
      gallery_images: ["https://example.com/img5.png"],
    },
  });

  const announcement = await prisma.announcement.create({
    data: {
      title: "Lunch Break",
      description: "A short break to relax and recharge before the next session.",
      startTime: new Date("2025-10-22T13:00:00Z"), // 1:00 PM UTC
      endTime: new Date("2025-10-22T13:30:00Z"),   // 1:30 PM UTC
    },
  });

  await prisma.member.createMany({
    data: [
      { name: "Alice Johnson", email: "alice@example.com", phone_number: "9876543210", department: "CSE", college_name: "ABC University", year_of_study: 3, location: "Hyderabad", attendance: 10, teamId: team1.id },
      { name: "Bob Kumar", email: "bob@example.com", phone_number: "9123456789", department: "IT", college_name: "XYZ College", year_of_study: 2, location: "Vijayawada", attendance: 8, teamId: team1.id },
      { name: "Catherine Rao", email: "cathy@example.com", phone_number: "9991112222", department: "ECE", college_name: "LMN Institute", year_of_study: 4, location: "Vizag", attendance: 12, teamId: team1.id },
      { name: "David Paul", email: "david@example.com", phone_number: "8887776666", department: "EEE", college_name: "ABC University", year_of_study: 1, location: "Hyderabad", attendance: 5, teamId: team1.id },
      { name: "Eva Sharma", email: "eva@example.com", phone_number: "7778889999", department: "MECH", college_name: "XYZ College", year_of_study: 2, location: "Warangal", attendance: 7, teamId: team1.id },

      { name: "Farhan Ali", email: "farhan@example.com", phone_number: "6665554444", department: "CSE", college_name: "ABC University", year_of_study: 3, location: "Hyderabad", attendance: 9, teamId: team2.id },
      { name: "Grace Lee", email: "grace@example.com", phone_number: "5554443333", department: "IT", college_name: "XYZ College", year_of_study: 2, location: "Vijayawada", attendance: 11, teamId: team2.id },
      { name: "Hari Krishna", email: "hari@example.com", phone_number: "4443332222", department: "ECE", college_name: "LMN Institute", year_of_study: 4, location: "Vizag", attendance: 6, teamId: team2.id },
      { name: "Isabel Dsouza", email: "isabel@example.com", phone_number: "3332221111", department: "EEE", college_name: "ABC University", year_of_study: 1, location: "Hyderabad", attendance: 10, teamId: team2.id },

      { name: "Jack Wilson", email: "jack@example.com", phone_number: "2221110000", department: "CSE", college_name: "ABC University", year_of_study: 3, location: "Hyderabad", attendance: 8, teamId: team3.id },
      { name: "Kavya Nair", email: "kavya@example.com", phone_number: "1110009999", department: "IT", college_name: "XYZ College", year_of_study: 2, location: "Vijayawada", attendance: 7, teamId: team3.id },
      { name: "Leo Thomas", email: "leo@example.com", phone_number: "9998887777", department: "ECE", college_name: "LMN Institute", year_of_study: 4, location: "Vizag", attendance: 13, teamId: team3.id },
      { name: "Mira Patel", email: "mira@example.com", phone_number: "8887776665", department: "EEE", college_name: "ABC University", year_of_study: 1, location: "Hyderabad", attendance: 6, teamId: team3.id },
      { name: "Nikhil Verma", email: "nikhil@example.com", phone_number: "7776665555", department: "CSE", college_name: "XYZ College", year_of_study: 2, location: "Warangal", attendance: 10, teamId: team3.id },
      { name: "Olivia Fernandez", email: "olivia@example.com", phone_number: "6665554443", department: "MECH", college_name: "LMN Institute", year_of_study: 3, location: "Vizag", attendance: 9, teamId: team3.id },

      { name: "Pranav Gupta", email: "pranav@example.com", phone_number: "5554443332", department: "CSE", college_name: "ABC University", year_of_study: 3, location: "Hyderabad", attendance: 12, teamId: team4.id },
      { name: "Qadir Hussain", email: "qadir@example.com", phone_number: "4443332221", department: "IT", college_name: "XYZ College", year_of_study: 2, location: "Vijayawada", attendance: 5, teamId: team4.id },
      { name: "Ritika Sharma", email: "ritika@example.com", phone_number: "3332221110", department: "ECE", college_name: "LMN Institute", year_of_study: 4, location: "Vizag", attendance: 11, teamId: team4.id },
      { name: "Suresh Kumar", email: "suresh@example.com", phone_number: "2221110009", department: "EEE", college_name: "ABC University", year_of_study: 1, location: "Hyderabad", attendance: 8, teamId: team4.id },

      { name: "Tanvi Rao", email: "tanvi@example.com", phone_number: "1110009998", department: "CSE", college_name: "ABC University", year_of_study: 3, location: "Hyderabad", attendance: 9, teamId: team5.id },
      { name: "Uday Kiran", email: "uday@example.com", phone_number: "9998887776", department: "IT", college_name: "XYZ College", year_of_study: 2, location: "Vijayawada", attendance: 6, teamId: team5.id },
      { name: "Varsha Menon", email: "varsha@example.com", phone_number: "8887776664", department: "ECE", college_name: "LMN Institute", year_of_study: 4, location: "Vizag", attendance: 12, teamId: team5.id },
      { name: "Waseem Akhtar", email: "waseem@example.com", phone_number: "7776665554", department: "EEE", college_name: "ABC University", year_of_study: 1, location: "Hyderabad", attendance: 7, teamId: team5.id },
      { name: "Yamini Reddy", email: "yamini@example.com", phone_number: "6665554442", department: "MECH", college_name: "XYZ College", year_of_study: 2, location: "Warangal", attendance: 10, teamId: team5.id },
    ],
  });

  await prisma.admin.create({
    data: {
      email: "admin@example.com",
      password: await generatePasswordHash("admin123"),
    },
  });

  console.log("Database seeded successfully!");
}

seed()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



