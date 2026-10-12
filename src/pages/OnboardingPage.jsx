import { useAppContext } from '../context/AppContext';

export default function OnboardingPage() {
  const { user, saveProfile, addSubject } = useAppContext();
  const handleSubmit = (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const subjects = values.subjects.split(',').map((subject) => subject.trim()).filter(Boolean);
    saveProfile({
      name: values.name,
      education: values.education,
      course: values.course,
      semester: values.semester,
      subjects,
      dailyAvailableHours: Number(values.dailyAvailableHours) || null,
      preferredStudyWindow: values.preferredStudyWindow,
      weeklyGoals: values.weeklyGoals,
    });
    subjects.forEach(addSubject);
  };

  return (
    <div className="page-shell narrow-shell">
      <div className="glass-card onboarding-card">
        <p className="eyebrow">First-time setup</p>
        <h1>Welcome to StudentOS</h1>
        <p className="muted-text">
          Let’s configure your academic profile so the planner can work with your routine.
        </p>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <div className="two-col-fields">
            <label>
              Name
              <input name="name" type="text" defaultValue={user.name === 'Student' ? '' : user.name} />
            </label>
            <label>
              Education type
              <input name="education" type="text" defaultValue={user.education} />
            </label>
            <label>
              Course
              <input name="course" type="text" defaultValue={user.course} />
            </label>
            <label>
              Semester
              <input name="semester" type="text" defaultValue={user.semester} />
            </label>
          </div>

          <label>
            Subjects
            <input name="subjects" type="text" defaultValue={user.subjects.join(', ')} placeholder="Separate subjects with commas" />
          </label>
          <label>
            Daily available study hours
            <input name="dailyAvailableHours" type="number" min="0" max="24" defaultValue={user.dailyAvailableHours || ''} />
          </label>
          <label>
            Preferred study time
            <input name="preferredStudyWindow" type="text" defaultValue={user.preferredStudyWindow} placeholder="e.g. 7 PM - 9 PM" />
          </label>
          <label>
            Weekly goals
            <textarea name="weeklyGoals" defaultValue={user.weeklyGoals || ''} rows={4} />
          </label>

          <button type="submit" className="primary-button">
            Save onboarding profile
          </button>
        </form>
      </div>
    </div>
  );
}
