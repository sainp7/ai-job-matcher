import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

interface AnalysisResult {
  match_score: number;
  skill_overlap: string[];
  missing_skills: string[];
  improved_bullets: string[];
  ats_keywords: {
    missing_keywords: string[];
    suggested_placements: {
      skills: string[];
      experience: string[];
    };
  };
  summary: string[];
  candidate_name?: string | null;
  company_name?: string | null;
  job_role?: string | null;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  headerSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
    textAlign: 'center',
  },
  candidateName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  jobInfo: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  score: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  scoreLabel: {
    marginLeft: 10,
    color: '#666',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  bullet: {
    marginBottom: 4,
    flexDirection: 'row',
  },
  bulletDot: {
    width: 10,
  },
  bulletText: {
    flex: 1,
  },
  greenText: {
    color: '#15803d',
  },
  redText: {
    color: '#b91c1c',
  },
  purpleText: {
    color: '#7e22ce',
  },
  keywordSection: {
    marginTop: 10,
  },
  subTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 5,
    marginBottom: 3,
  }
});

export const AnalysisReportPDF = ({ result }: { result: AnalysisResult }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Analysis Report</Text>

      {(result.candidate_name || result.company_name || result.job_role) && (
        <View style={styles.headerSection}>
          {result.candidate_name && <Text style={styles.candidateName}>{result.candidate_name}</Text>}
          <Text style={styles.jobInfo}>
            {result.job_role} {result.job_role && result.company_name && 'at'} {result.company_name}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Match Score</Text>
        <View style={styles.scoreRow}>
          <Text style={styles.score}>{result.match_score}%</Text>
          <Text style={styles.scoreLabel}>Overall compatibility with the role.</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={[styles.section, styles.col]}>
          <Text style={[styles.sectionTitle, styles.greenText]}>Skill Overlap</Text>
          {result.skill_overlap.map((skill, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{skill}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.section, styles.col]}>
          <Text style={[styles.sectionTitle, styles.redText]}>Missing Skills</Text>
          {result.missing_skills.map((skill, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        {result.summary.map((point, i) => (
          <View key={i} style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{point}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Improved Resume Bullets</Text>
        {result.improved_bullets.map((bullet, i) => (
          <View key={i} style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{bullet}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, styles.purpleText]}>ATS Keyword Suggestions</Text>
        <View style={styles.keywordSection}>
          <Text style={styles.subTitle}>Missing Keywords:</Text>
          <Text>{result.ats_keywords.missing_keywords.join(', ') || 'None identified'}</Text>
        </View>
        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.subTitle}>Suggested for Skills:</Text>
            {result.ats_keywords.suggested_placements.skills.map((s, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))}
          </View>
          <View style={styles.col}>
            <Text style={styles.subTitle}>Suggested for Experience:</Text>
            {result.ats_keywords.suggested_placements.experience.map((e, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{e}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Page>
  </Document>
);
