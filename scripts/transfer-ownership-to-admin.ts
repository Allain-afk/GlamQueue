/**
 * Script to transfer ownership of staff and services to admin@test.com
 * 
 * This script:
 * 1. Finds admin@test.com's user ID and organization_id
 * 2. Updates all staff/manager profiles to have the admin's organization_id
 * 3. Updates all services to have the admin's organization_id
 * 
 * Run with: npx tsx scripts/transfer-ownership-to-admin.ts
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function transferOwnershipToAdmin() {
  try {
    console.log('Starting ownership transfer to admin@test.com...\n');

    // Step 1: Find admin@test.com's user ID and organization_id
    console.log('Step 1: Finding admin@test.com...');
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('id, email, organization_id, role')
      .eq('email', 'admin@test.com')
      .single();

    if (adminError || !adminProfile) {
      console.error('Error: Could not find admin@test.com');
      console.error('Error details:', adminError);
      process.exit(1);
    }

    console.log(`Found admin: ${adminProfile.email} (ID: ${adminProfile.id})`);
    console.log(`Admin organization_id: ${adminProfile.organization_id || 'NULL'}\n`);

    if (!adminProfile.organization_id) {
      console.warn('Warning: admin@test.com does not have an organization_id');
      console.warn('You may need to create an organization for the admin first.');
      console.warn('Continuing anyway...\n');
    }

    const adminOrgId = adminProfile.organization_id;

    // Step 2: Update all staff/manager profiles to have admin's organization_id
    console.log('Step 2: Updating staff and manager profiles...');
    const { data: staffProfiles, error: staffError } = await supabase
      .from('profiles')
      .select('id, email, role, organization_id')
      .in('role', ['staff', 'manager']);

    if (staffError) {
      console.error('Error fetching staff profiles:', staffError);
      process.exit(1);
    }

    console.log(`Found ${staffProfiles?.length || 0} staff/manager profiles`);

    if (staffProfiles && staffProfiles.length > 0) {
      const staffIds = staffProfiles.map(p => p.id);
      
      const { error: updateStaffError } = await supabase
        .from('profiles')
        .update({ organization_id: adminOrgId })
        .in('id', staffIds)
        .in('role', ['staff', 'manager']);

      if (updateStaffError) {
        console.error('Error updating staff profiles:', updateStaffError);
        process.exit(1);
      }

      console.log(`✓ Updated ${staffIds.length} staff/manager profiles to organization_id: ${adminOrgId}`);
      
      // Show updated profiles
      staffProfiles.forEach(profile => {
        console.log(`  - ${profile.email} (${profile.role})`);
      });
    } else {
      console.log('No staff/manager profiles found to update');
    }

    console.log('');

    // Step 3: Update all services to have admin's organization_id
    console.log('Step 3: Updating services...');
    
    // First, get all services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, organization_id');

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      process.exit(1);
    }

    console.log(`Found ${services?.length || 0} services`);

    if (services && services.length > 0) {
      const serviceIds = services.map(s => s.id);
      
      const { error: updateServicesError } = await supabase
        .from('services')
        .update({ organization_id: adminOrgId })
        .in('id', serviceIds);

      if (updateServicesError) {
        console.error('Error updating services:', updateServicesError);
        process.exit(1);
      }

      console.log(`✓ Updated ${serviceIds.length} services to organization_id: ${adminOrgId}`);
      
      // Show updated services
      services.forEach(service => {
        console.log(`  - ${service.name} (ID: ${service.id})`);
      });
    } else {
      console.log('No services found to update');
    }

    console.log('\n✓ Ownership transfer completed successfully!');
    console.log(`\nSummary:`);
    console.log(`- Admin: ${adminProfile.email}`);
    console.log(`- Organization ID: ${adminOrgId || 'NULL (needs to be set)'}`);
    console.log(`- Staff/Managers updated: ${staffProfiles?.length || 0}`);
    console.log(`- Services updated: ${services?.length || 0}`);

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
transferOwnershipToAdmin();

