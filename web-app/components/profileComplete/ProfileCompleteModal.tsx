'use client';

import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

// ─── Types ─────────────────────────────────────────────────────────────────
interface ProfileData {
  name: string;
  educationLevel: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  workStatus: string;
  currentlyPursuing: boolean;
  pursuingLevel: string;
  collegeName: string;
  degree: string;
  specialization: string;
  completionYear: string;
  currentCity: string;
  openToRelocation: boolean;
  preferredCities: string[];
  keySkills: string;
  preferredJobRoles: string[];
  englishLevel: string;
}

interface Props {
  userEmail: string;
  userName: string;
  initialData?: Partial<ProfileData>;
  onComplete: () => void;
  onDismiss: () => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const TOTAL_STEPS = 8;

const EDU_LEVELS = ['10th or Below 10th', '12th Pass', 'Diploma', 'ITI', 'Graduate', 'Post Graduate'];
const WORK_STATUSES = ['Fresher', 'Experienced', 'Student / Currently Pursuing'];
const PURSUING_LEVELS = ['10th', '12th', 'Diploma', 'ITI', 'Graduation', 'Post Graduation'];
const DEGREES = ['B.Tech / B.E.', 'B.Sc', 'B.Com', 'B.A', 'MBA', 'M.Tech', 'M.Sc', 'M.Com', 'M.A', 'PhD', 'Diploma', 'Other'];
const ENGLISH_LEVELS = ['No English', 'Basic', 'Conversational', 'Proficient', 'Fluent'];
const STEP_TITLES = [
  'Basic Details',
  'Personal Information',
  'Experience Details',
  'Education Details',
  'Location Details',
  'Key Skills',
  'Preferred Job Roles',
  'Language Proficiency',
];

const ALL_CITIES = [
  'Ahmedabad', 'Ajmer', 'Aligarh', 'Amritsar', 'Asansol', 'Aurangabad',
  'Bangalore', 'Bhopal', 'Bhubaneswar', 'Chandigarh', 'Chennai', 'Coimbatore',
  'Cuttack', 'Dehradun', 'Delhi', 'Dhanbad', 'Faridabad', 'Ghaziabad',
  'Guwahati', 'Gwalior', 'Hyderabad', 'Indore', 'Jaipur', 'Jalandhar',
  'Jammu', 'Jamshedpur', 'Jodhpur', 'Kanpur', 'Kochi', 'Kolkata',
  'Lucknow', 'Ludhiana', 'Madurai', 'Meerut', 'Mumbai', 'Mysore',
  'Nagpur', 'Nashik', 'Noida', 'Patna', 'Pune', 'Raipur', 'Rajkot',
  'Ranchi', 'Surat', 'Thiruvananthapuram', 'Vadodara', 'Varanasi', 'Visakhapatnam',
];

const COMMON_SKILLS = [
  'Communication', 'MS Office', 'Data Entry', 'Sales', 'Customer Service',
  'Accounting', 'Tally', 'Python', 'Java', 'React', 'Flutter',
  'Project Management', 'Leadership', 'Marketing', 'Content Writing',
  'Graphic Design', 'AutoCAD', 'Electrical', 'Mechanical', 'Civil',
  'Teaching', 'Nursing', 'HR Management', 'Logistics', 'Supply Chain',
];

const COMMON_JOB_ROLES = [
  'Software Developer', 'Web Developer', 'Data Analyst', 'HR Executive',
  'Sales Executive', 'Marketing Manager', 'Accountant', 'Teacher',
  'Nurse', 'Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer',
  'Content Writer', 'Graphic Designer', 'Business Analyst',
  'Operations Manager', 'Customer Support', 'Logistics Executive',
];

// ─── Chip Component ──────────────────────────────────────────────────────────
function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 24,
        border: `1.5px solid ${selected ? '#14a077' : '#e0e0e0'}`,
        background: selected ? '#e8f5ef' : '#fff',
        color: selected ? '#14a077' : '#555',
        fontSize: 13,
        fontWeight: selected ? 600 : 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
        outline: 'none',
      }}
    >
      {selected && <span style={{ marginRight: 4 }}>✓</span>}
      {label}
    </button>
  );
}

// ─── Field Label ─────────────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
      {children}
      {required && <span style={{ color: '#e53935', marginLeft: 3 }}>*</span>}
    </div>
  );
}

// ─── Text Input ──────────────────────────────────────────────────────────────
function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        padding: '10px 14px',
        borderRadius: 10,
        border: '1.5px solid #e0e0e0',
        fontSize: 14,
        color: '#1a1a2e',
        background: props.disabled ? '#f9f9f9' : '#fff',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s',
        ...props.style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = '#14a077'; }}
      onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; }}
    />
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: '1px solid #f0f0f0',
      padding: '20px',
      marginBottom: 14,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      {children}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function ProfileCompleteModal({ userEmail, userName, initialData, onComplete, onDismiss }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isEditing = !!initialData;

  const [data, setData] = useState<ProfileData>({
    name:              initialData?.name              ?? userName    ?? '',
    educationLevel:    initialData?.educationLevel    ?? '',
    dateOfBirth:       initialData?.dateOfBirth       ?? '',
    gender:            initialData?.gender            ?? '',
    email:             initialData?.email             ?? userEmail   ?? '',
    workStatus:        initialData?.workStatus        ?? '',
    currentlyPursuing: initialData?.currentlyPursuing ?? false,
    pursuingLevel:     initialData?.pursuingLevel     ?? '',
    collegeName:       initialData?.collegeName       ?? '',
    degree:            initialData?.degree            ?? '',
    specialization:    initialData?.specialization    ?? '',
    completionYear:    initialData?.completionYear    ?? '',
    currentCity:       initialData?.currentCity       ?? '',
    openToRelocation:  initialData?.openToRelocation  ?? false,
    preferredCities:   initialData?.preferredCities   ?? [],
    keySkills:         initialData?.keySkills         ?? '',
    preferredJobRoles: initialData?.preferredJobRoles ?? [],
    englishLevel:      initialData?.englishLevel      ?? '',
  });

  const set = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setData(prev => ({ ...prev, [key]: value }));

  // Scroll to top on step change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setError('');
  }, [step]);

  const validate = (): string | null => {
    switch (step) {
      case 0:
        if (!data.name.trim()) return 'Please enter your full name';
        if (!data.educationLevel) return 'Please select your education level';
        return null;
      case 1:
        if (!data.dateOfBirth) return 'Please enter your date of birth';
        if (!data.gender) return 'Please select your gender';
        return null;
      case 2:
        if (!data.workStatus) return 'Please select your work status';
        return null;
      case 3:
        if (data.currentlyPursuing) {
          if (!data.pursuingLevel) return 'Please select the level you are pursuing';
          if (!data.collegeName.trim()) return 'Please enter your college name';
          if (!data.degree) return 'Please select your degree';
        }
        return null;
      case 4:
        if (!data.currentCity) return 'Please select your current city';
        return null;
      case 5:
        if (!data.keySkills) return 'Please select at least one skill';
        return null;
      case 6:
        if (data.preferredJobRoles.length === 0) return 'Please select at least one job role';
        return null;
      case 7:
        if (!data.englishLevel) return 'Please select your English proficiency';
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    setError('');
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');
      const skillsArray = data.keySkills.split(',').map(s => s.trim()).filter(Boolean);
      await setDoc(doc(db, 'users', uid), {
        name: data.name,
        educationLevel: data.educationLevel,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        email: data.email,
        workStatus: data.workStatus,
        currentlyPursuing: data.currentlyPursuing,
        pursuingLevel: data.pursuingLevel,
        collegeName: data.collegeName,
        degree: data.degree,
        specialization: data.specialization,
        completionYear: data.completionYear,
        currentCity: data.currentCity,
        openToRelocation: data.openToRelocation,
        preferredCities: data.preferredCities,
        keySkills: data.keySkills,
        preferredJobRoles: data.preferredJobRoles,
        englishLevel: data.englishLevel,
        profileComplete: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      onComplete();
    } catch (e: any) {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    const current = data.keySkills ? data.keySkills.split(', ').filter(Boolean) : [];
    const updated = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill];
    set('keySkills', updated.join(', '));
  };

  const toggleRole = (role: string) => {
    const current = data.preferredJobRoles;
    set('preferredJobRoles', current.includes(role) ? current.filter(r => r !== role) : [...current, role]);
  };

  const toggleCity = (city: string) => {
    const current = data.preferredCities;
    set('preferredCities', current.includes(city) ? current.filter(c => c !== city) : [...current, city]);
  };

  const selectedSkills = data.keySkills ? data.keySkills.split(', ').filter(Boolean) : [];
  const filteredCities = ALL_CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));
  const filteredSkills = COMMON_SKILLS.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()));
  const filteredRoles = COMMON_JOB_ROLES.filter(r => r.toLowerCase().includes(roleSearch.toLowerCase()));

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  // ─── Step content ───────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // Step 0: Name + Education Level
      case 0:
        return (
          <>
            <Card>
              <FieldLabel required>Tell us your full name</FieldLabel>
              <StyledInput
                type="text"
                placeholder="Enter full name"
                value={data.name}
                onChange={e => set('name', e.target.value)}
                autoFocus
              />
            </Card>
            <Card>
              <FieldLabel required>What is your highest level of education?</FieldLabel>
              <p style={{ fontSize: 12, color: '#999', margin: '0 0 12px' }}>Select highest education level even if not completed</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EDU_LEVELS.map(l => (
                  <Chip key={l} label={l} selected={data.educationLevel === l} onClick={() => set('educationLevel', l)} />
                ))}
              </div>
            </Card>
          </>
        );

      // Step 1: DOB + Gender + Email
      case 1:
        return (
          <Card>
            <div style={{ marginBottom: 18 }}>
              <FieldLabel>Name</FieldLabel>
              <StyledInput type="text" value={data.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <FieldLabel required>Date of Birth</FieldLabel>
              <StyledInput
                type="date"
                value={data.dateOfBirth}
                onChange={e => set('dateOfBirth', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <FieldLabel required>Gender</FieldLabel>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Male', 'Female', 'Other'].map(g => (
                  <Chip key={g} label={g} selected={data.gender === g} onClick={() => set('gender', g)} />
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Email Address</FieldLabel>
              <StyledInput type="email" value={data.email} disabled />
            </div>
          </Card>
        );

      // Step 2: Work Status
      case 2:
        return (
          <Card>
            <FieldLabel required>What is your current work status?</FieldLabel>
            <p style={{ fontSize: 12, color: '#999', margin: '0 0 16px' }}>This helps us match you with the right opportunities</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {WORK_STATUSES.map(ws => (
                <button
                  type="button"
                  key={ws}
                  onClick={() => set('workStatus', ws)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 12,
                    border: `1.5px solid ${data.workStatus === ws ? '#14a077' : '#e0e0e0'}`,
                    background: data.workStatus === ws ? '#e8f5ef' : '#fff',
                    color: data.workStatus === ws ? '#14a077' : '#555',
                    fontSize: 14,
                    fontWeight: data.workStatus === ws ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 20 }}>
                    {ws === 'Fresher' ? '🎓' : ws === 'Experienced' ? '💼' : '📚'}
                  </span>
                  {ws}
                  {data.workStatus === ws && <span style={{ marginLeft: 'auto' }}>✓</span>}
                </button>
              ))}
            </div>
          </Card>
        );

      // Step 3: Education Details
      case 3:
        return (
          <>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <FieldLabel>Are you currently pursuing education?</FieldLabel>
                <button
                  type="button"
                  onClick={() => set('currentlyPursuing', !data.currentlyPursuing)}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: data.currentlyPursuing ? '#14a077' : '#ccc',
                    border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, transition: 'left 0.2s',
                    left: data.currentlyPursuing ? 23 : 3,
                  }} />
                </button>
              </div>
            </Card>

            {data.currentlyPursuing && (
              <Card>
                <div style={{ marginBottom: 14 }}>
                  <FieldLabel required>Education Level Being Pursued</FieldLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {PURSUING_LEVELS.map(l => (
                      <Chip key={l} label={l} selected={data.pursuingLevel === l} onClick={() => set('pursuingLevel', l)} />
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <FieldLabel required>College / Institute Name</FieldLabel>
                  <StyledInput
                    type="text"
                    placeholder="e.g. IIT Delhi"
                    value={data.collegeName}
                    onChange={e => set('collegeName', e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <FieldLabel required>Degree</FieldLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {DEGREES.map(d => (
                      <Chip key={d} label={d} selected={data.degree === d} onClick={() => set('degree', d)} />
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <FieldLabel>Specialization</FieldLabel>
                  <StyledInput
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={data.specialization}
                    onChange={e => set('specialization', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Expected Completion Year</FieldLabel>
                  <StyledInput
                    type="number"
                    placeholder="e.g. 2026"
                    value={data.completionYear}
                    onChange={e => set('completionYear', e.target.value)}
                    min="2024"
                    max="2035"
                  />
                </div>
              </Card>
            )}

            {!data.currentlyPursuing && (
              <Card>
                <p style={{ color: '#888', fontSize: 14, margin: 0, textAlign: 'center', padding: '8px 0' }}>
                  💡 Enable above if you are currently studying. Otherwise, click Next to continue.
                </p>
              </Card>
            )}
          </>
        );

      // Step 4: Location
      case 4:
        return (
          <>
            <Card>
              <FieldLabel required>Current City</FieldLabel>
              <StyledInput
                type="text"
                placeholder="Search or type your city..."
                value={citySearch || data.currentCity}
                onChange={e => { setCitySearch(e.target.value); if (!e.target.value) set('currentCity', ''); }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && citySearch.trim()) {
                    set('currentCity', citySearch.trim());
                    setCitySearch('');
                  }
                }}
              />
              {citySearch && (
                <div style={{
                  maxHeight: 200, overflowY: 'auto', border: '1px solid #e0e0e0',
                  borderRadius: 10, marginTop: 6, background: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}>
                  {filteredCities.slice(0, 10).map(city => (
                    <div
                      key={city}
                      onClick={() => { set('currentCity', city); setCitySearch(''); }}
                      style={{
                        padding: '10px 14px', cursor: 'pointer', fontSize: 14,
                        background: data.currentCity === city ? '#e8f5ef' : '#fff',
                        color: data.currentCity === city ? '#14a077' : '#333',
                      }}
                      onMouseEnter={e => { if (data.currentCity !== city) e.currentTarget.style.background = '#f5f5f5'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = data.currentCity === city ? '#e8f5ef' : '#fff'; }}
                    >
                      {city}
                    </div>
                  ))}
                  {/* Allow typing any city not in the list */}
                  {citySearch.trim() &&
                    !filteredCities.some(c => c.toLowerCase() === citySearch.trim().toLowerCase()) && (
                    <div
                      onClick={() => { set('currentCity', citySearch.trim()); setCitySearch(''); }}
                      style={{
                        padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                        color: '#14a077', fontWeight: 600,
                        borderTop: filteredCities.length > 0 ? '1px dashed #e0e0e0' : 'none',
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: '#fff',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f0faf6'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                    >
                      <span style={{ fontSize: 16 }}>📍</span>
                      Use &quot;<strong>{citySearch.trim()}</strong>&quot; as my city
                    </div>
                  )}
                </div>
              )}
              {data.currentCity && !citySearch && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: '#e8f5ef', color: '#14a077', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                    📍 {data.currentCity}
                  </span>
                  <button type="button" onClick={() => { set('currentCity', ''); setCitySearch(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 12 }}>
                    Change
                  </button>
                </div>
              )}
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <FieldLabel>Open to Relocation?</FieldLabel>
                <button
                  type="button"
                  onClick={() => set('openToRelocation', !data.openToRelocation)}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: data.openToRelocation ? '#14a077' : '#ccc',
                    border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, transition: 'left 0.2s',
                    left: data.openToRelocation ? 23 : 3,
                  }} />
                </button>
              </div>
            </Card>

            {data.openToRelocation && (
              <Card>
                <FieldLabel>Preferred Cities for Relocation</FieldLabel>
                <p style={{ fontSize: 12, color: '#999', margin: '0 0 10px' }}>Select all that apply</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ALL_CITIES.filter(c => c !== data.currentCity).slice(0, 20).map(city => (
                    <Chip key={city} label={city} selected={data.preferredCities.includes(city)} onClick={() => toggleCity(city)} />
                  ))}
                </div>
              </Card>
            )}
          </>
        );

      // Step 5: Skills
      case 5:
        return (
          <Card>
            <FieldLabel required>Key Skills</FieldLabel>
            <p style={{ fontSize: 12, color: '#999', margin: '0 0 12px' }}>Select skills that best describe your expertise</p>
            <StyledInput
              type="text"
              placeholder="Search skills..."
              value={skillSearch}
              onChange={e => setSkillSearch(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            {selectedSkills.length > 0 && (
              <div style={{ marginBottom: 12, padding: '10px 12px', background: '#e8f5ef', borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: '#14a077', fontWeight: 600 }}>
                  ✓ {selectedSkills.length} selected: {selectedSkills.join(', ')}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {filteredSkills.map(skill => (
                <Chip key={skill} label={skill} selected={selectedSkills.includes(skill)} onClick={() => toggleSkill(skill)} />
              ))}
            </div>
          </Card>
        );

      // Step 6: Job Roles
      case 6:
        return (
          <Card>
            <FieldLabel required>Preferred Job Roles</FieldLabel>
            <p style={{ fontSize: 12, color: '#999', margin: '0 0 12px' }}>Choose roles you are interested in applying for</p>
            <StyledInput
              type="text"
              placeholder="Search job roles..."
              value={roleSearch}
              onChange={e => setRoleSearch(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            {data.preferredJobRoles.length > 0 && (
              <div style={{ marginBottom: 12, padding: '10px 12px', background: '#e8f5ef', borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: '#14a077', fontWeight: 600 }}>
                  ✓ {data.preferredJobRoles.length} selected: {data.preferredJobRoles.join(', ')}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {filteredRoles.map(role => (
                <Chip key={role} label={role} selected={data.preferredJobRoles.includes(role)} onClick={() => toggleRole(role)} />
              ))}
            </div>
          </Card>
        );

      // Step 7: English Level
      case 7:
        return (
          <Card>
            <FieldLabel required>English Proficiency Level</FieldLabel>
            <p style={{ fontSize: 12, color: '#999', margin: '0 0 16px' }}>Select your level of comfort with English</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ENGLISH_LEVELS.map((level, i) => {
                const descs = [
                  'Cannot read/write/speak English',
                  'Can understand basic English',
                  'Can hold casual English conversations',
                  'Comfortable in professional English settings',
                  'Speak/write English with full confidence',
                ];
                return (
                  <button
                    type="button"
                    key={level}
                    onClick={() => set('englishLevel', level)}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 12,
                      border: `1.5px solid ${data.englishLevel === level ? '#14a077' : '#e0e0e0'}`,
                      background: data.englishLevel === level ? '#e8f5ef' : '#fff',
                      color: '#333',
                      fontSize: 14,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: data.englishLevel === level ? 700 : 600, color: data.englishLevel === level ? '#14a077' : '#1a1a2e' }}>
                      {level}
                    </div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{descs[i]}</div>
                  </button>
                );
              })}
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)', zIndex: 99998,
        animation: 'pcFadeIn 0.25s ease',
      }} />

      {/* Modal */}
      <div className="pc-modal-wrap" style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}>
        <div className="pc-modal-card" style={{
          background: '#f5f7fa',
          borderRadius: 20,
          width: '100%',
          maxWidth: 540,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          animation: 'pcSlideUp 0.3s ease',
          overflow: 'hidden',
        }}>

          {/* ── Header ── */}
          <div style={{
            background: 'linear-gradient(135deg, #0f2557 0%, #14a077 100%)',
            padding: '20px 24px 16px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Step {step + 1} of {TOTAL_STEPS}
                </div>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginTop: 2 }}>
                  {STEP_TITLES[step]}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: '#fff',
                borderRadius: 4,
                transition: 'width 0.35s ease',
              }} />
            </div>
          </div>

          {/* ── Scrollable Body ── */}
          <div ref={scrollRef} className="pc-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

            {/* Welcome message on first step */}
            {step === 0 && (
              <div style={{
                background: isEditing
                  ? 'linear-gradient(135deg, #fef3c7, #fff8e1)'
                  : 'linear-gradient(135deg, #e8f5ef, #e3f2fd)',
                borderRadius: 12, padding: '14px 18px', marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 28 }}>{isEditing ? '✏️' : '👋'}</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 14 }}>
                    {isEditing ? 'Update Your Profile' : 'Build Your Profile'}
                  </div>
                  <div style={{ color: '#555', fontSize: 12, marginTop: 2 }}>
                    {isEditing
                      ? 'Your existing data is pre-filled. Update any fields and save.'
                      : 'Takes ~2 minutes. Get matched with the best jobs!'}
                  </div>
                </div>
              </div>
            )}

            {renderStep()}

            {/* Error */}
            {error && (
              <div style={{
                background: '#fce4ec', border: '1px solid #f8bbd9', borderRadius: 10,
                padding: '10px 14px', color: '#c62828', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
              }}>
                <span>⚠️</span> {error}
              </div>
            )}
          </div>

          {/* ── Footer Navigation ── */}
          <div style={{
            padding: '14px 20px',
            background: '#fff',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            gap: 10,
            flexShrink: 0,
          }}>
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  flex: 1, padding: '13px', borderRadius: 12,
                  border: '1.5px solid #e0e0e0', background: '#fff',
                  color: '#555', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              style={{
                flex: 2, padding: '13px', borderRadius: 12,
                border: 'none',
                background: saving ? '#a0d4bf' : 'linear-gradient(135deg, #14a077, #0f7a5a)',
                color: '#fff', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 0.2s',
              }}
            >
              {saving ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pcSpin 0.8s linear infinite' }} />
                  Saving...
                </>
              ) : step === TOTAL_STEPS - 1 ? '🎉 Finish & Save' : 'Next →'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pcFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pcSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes pcSpin { to { transform: rotate(360deg) } }

        /* Mobile: full-screen modal for fast, native feel */
        @media (max-width: 600px) {
          .pc-modal-wrap {
            padding: 0 !important;
            align-items: flex-end !important;
          }
          .pc-modal-card {
            border-radius: 20px 20px 0 0 !important;
            max-height: 92dvh !important;
            max-width: 100% !important;
          }
          .pc-modal-body {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </>
  );
}
