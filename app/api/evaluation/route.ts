import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from('evaluations').insert({
      respondent_type:       body.respondent_type,
      years_experience:      body.years_experience,
      used_similar_systems:  body.used_similar_systems,
      systems_used:          body.systems_used,

      // Usability
      ease_of_use:           body.ease_of_use,
      navigation:            body.navigation,
      visual_design:         body.visual_design,
      mobile_friendliness:   body.mobile_friendliness,
      loading_speed:         body.loading_speed,

      // Features
      outbreak_reporting:    body.outbreak_reporting,
      map_usefulness:        body.map_usefulness,
      alert_system:          body.alert_system,
      data_export:           body.data_export,
      offline_mode:          body.offline_mode,
      ussd_concept:          body.ussd_concept,

      // Comparison
      vs_sormas:             body.vs_sormas,
      vs_afydata:            body.vs_afydata,
      vs_dhis2:              body.vs_dhis2,
      onehealth_advantage:   body.onehealth_advantage,

      // Open ended
      best_feature:          body.best_feature,
      needs_improvement:     body.needs_improvement,
      would_recommend:       body.would_recommend,
      additional_comments:   body.additional_comments,

      submitted_at: new Date().toISOString(),
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}