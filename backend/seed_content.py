"""
Seed educational content into the database
"""
from database import content_collection
import asyncio

MENTAL_HEALTH_CONTENT = [
    # BIPOLAR DISORDER RESOURCES (11 total)
    {
        "id": "1",
        "title": "Understanding Bipolar Disorder",
        "content_type": "article",
        "category": "bipolar",
        "description": "Learn about the symptoms, triggers, and management strategies for bipolar disorder.",
        "content_url": "https://www.nimh.nih.gov/health/topics/bipolar-disorder",
        "tags": ["bipolar", "education", "symptoms"]
    },
    {
        "id": "2",
        "title": "Managing Manic Episodes",
        "content_type": "article",
        "category": "bipolar",
        "description": "Strategies for recognizing and managing manic or hypomanic episodes.",
        "content_url": "https://www.dbsalliance.org/education/bipolar-disorder/",
        "tags": ["bipolar", "mania", "management"]
    },
    {
        "id": "3",
        "title": "Bipolar Depression: What's Different",
        "content_type": "article",
        "category": "bipolar",
        "description": "Understanding the unique aspects of depression in bipolar disorder.",
        "content_url": "https://www.psychiatry.org/patients-families/bipolar-disorders",
        "tags": ["bipolar", "depression", "symptoms"]
    },
    {
        "id": "4",
        "title": "Mood Tracking for Bipolar",
        "content_type": "article",
        "category": "bipolar",
        "description": "How to effectively track mood patterns and identify triggers.",
        "content_url": "https://www.dbsalliance.org/",
        "tags": ["bipolar", "tracking", "patterns"]
    },
    {
        "id": "5",
        "title": "Bipolar Medication Management",
        "content_type": "article",
        "category": "bipolar",
        "description": "Understanding mood stabilizers and other medications for bipolar.",
        "content_url": "https://www.nami.org/About-Mental-Illness/Mental-Health-Conditions/Bipolar-Disorder",
        "tags": ["bipolar", "medication", "treatment"]
    },
    {
        "id": "6",
        "title": "Sleep and Bipolar Disorder",
        "content_type": "article",
        "category": "bipolar",
        "description": "The critical relationship between sleep patterns and mood stability.",
        "content_url": "https://www.sleepfoundation.org/mental-health/bipolar-disorder-and-sleep",
        "tags": ["bipolar", "sleep", "wellness"]
    },
    {
        "id": "7",
        "title": "Bipolar II: What You Need to Know",
        "content_type": "article",
        "category": "bipolar",
        "description": "Understanding the differences between Bipolar I and Bipolar II.",
        "content_url": "https://www.nami.org/About-Mental-Illness/Mental-Health-Conditions/Bipolar-Disorder",
        "tags": ["bipolar", "diagnosis", "education"]
    },
    {
        "id": "8",
        "title": "Rapid Cycling Bipolar",
        "content_type": "article",
        "category": "bipolar",
        "description": "Managing rapid cycling and mixed episodes in bipolar disorder.",
        "content_url": "https://www.dbsalliance.org/education/bipolar-disorder/rapid-cycling/",
        "tags": ["bipolar", "rapid-cycling", "symptoms"]
    },
    {
        "id": "9",
        "title": "Bipolar and Relationships",
        "content_type": "article",
        "category": "bipolar",
        "description": "Maintaining healthy relationships while managing bipolar disorder.",
        "content_url": "https://www.nami.org/Your-Journey/Individuals-with-Mental-Illness/",
        "tags": ["bipolar", "relationships", "support"]
    },
    {
        "id": "10",
        "title": "Recognizing Mood Episode Warning Signs",
        "content_type": "article",
        "category": "bipolar",
        "description": "Learn to identify early warning signs of manic or depressive episodes.",
        "content_url": "https://www.dbsalliance.org/education/bipolar-disorder/",
        "tags": ["bipolar", "warning-signs", "prevention"]
    },
    {
        "id": "11",
        "title": "Bipolar Disorder and Work",
        "content_type": "article",
        "category": "bipolar",
        "description": "Strategies for managing bipolar disorder in the workplace.",
        "content_url": "https://www.nami.org/Your-Journey/Individuals-with-Mental-Illness/",
        "tags": ["bipolar", "work", "career"]
    },
    
    # ADHD RESOURCES (11 total)
    {
        "id": "12",
        "title": "Managing ADHD in Daily Life",
        "content_type": "article",
        "category": "adhd",
        "description": "Practical tips for managing ADHD symptoms including focus, organization, and time management.",
        "content_url": "https://www.additudemag.com/",
        "tags": ["adhd", "management", "focus"]
    },
    {
        "id": "13",
        "title": "ADHD Time Management Strategies",
        "content_type": "article",
        "category": "adhd",
        "description": "Overcome time blindness with practical time management techniques.",
        "content_url": "https://chadd.org/about-adhd/time-management/",
        "tags": ["adhd", "time-management", "productivity"]
    },
    {
        "id": "14",
        "title": "Understanding ADHD Hyperfocus",
        "content_type": "article",
        "category": "adhd",
        "description": "Learn about hyperfocus episodes and how to harness them productively.",
        "content_url": "https://www.additudemag.com/understanding-adhd-hyperfocus/",
        "tags": ["adhd", "hyperfocus", "productivity"]
    },
    {
        "id": "15",
        "title": "ADHD and Emotional Regulation",
        "content_type": "article",
        "category": "adhd",
        "description": "Understanding the connection between ADHD and emotional dysregulation.",
        "content_url": "https://chadd.org/about-adhd/overview/",
        "tags": ["adhd", "emotions", "regulation"]
    },
    {
        "id": "16",
        "title": "Organization Systems for ADHD",
        "content_type": "article",
        "category": "adhd",
        "description": "Create ADHD-friendly organization systems that actually work.",
        "content_url": "https://www.additudemag.com/organization-tips-adhd/",
        "tags": ["adhd", "organization", "systems"]
    },
    {
        "id": "17",
        "title": "ADHD Medication Guide",
        "content_type": "article",
        "category": "adhd",
        "description": "Understanding stimulant and non-stimulant medications for ADHD.",
        "content_url": "https://chadd.org/about-adhd/medication-management/",
        "tags": ["adhd", "medication", "treatment"]
    },
    {
        "id": "18",
        "title": "ADHD in Adults",
        "content_type": "article",
        "category": "adhd",
        "description": "How ADHD presents differently in adults and strategies for management.",
        "content_url": "https://www.additudemag.com/adhd-in-adults/",
        "tags": ["adhd", "adults", "diagnosis"]
    },
    {
        "id": "19",
        "title": "Rejection Sensitive Dysphoria",
        "content_type": "article",
        "category": "adhd",
        "description": "Understanding and managing rejection sensitivity in ADHD.",
        "content_url": "https://www.additudemag.com/rejection-sensitive-dysphoria-adhd/",
        "tags": ["adhd", "rsd", "emotions"]
    },
    {
        "id": "20",
        "title": "ADHD and Sleep Problems",
        "content_type": "article",
        "category": "adhd",
        "description": "Why sleep is difficult with ADHD and how to improve it.",
        "content_url": "https://chadd.org/about-adhd/sleep-problems/",
        "tags": ["adhd", "sleep", "wellness"]
    },
    {
        "id": "21",
        "title": "Body Doubling for ADHD",
        "content_type": "article",
        "category": "adhd",
        "description": "How working alongside others can boost ADHD productivity.",
        "content_url": "https://www.additudemag.com/body-doubling-adhd-productivity/",
        "tags": ["adhd", "productivity", "strategies"]
    },
    {
        "id": "22",
        "title": "ADHD Exercise and Movement",
        "content_type": "article",
        "category": "adhd",
        "description": "How physical activity helps manage ADHD symptoms.",
        "content_url": "https://www.additudemag.com/exercise-for-adhd/",
        "tags": ["adhd", "exercise", "wellness"]
    },
    
    # DEPRESSION RESOURCES (11 total)
    {
        "id": "23",
        "title": "Depression: Signs and Coping Strategies",
        "content_type": "article",
        "category": "depression",
        "description": "Recognize signs of depression and learn evidence-based coping techniques.",
        "content_url": "https://www.nimh.nih.gov/health/topics/depression",
        "tags": ["depression", "coping", "symptoms"]
    },
    {
        "id": "24",
        "title": "Cognitive Behavioral Therapy for Depression",
        "content_type": "article",
        "category": "depression",
        "description": "How CBT helps challenge negative thought patterns in depression.",
        "content_url": "https://www.apa.org/ptsd-guideline/patients-and-families/cognitive-behavioral",
        "tags": ["depression", "cbt", "therapy"]
    },
    {
        "id": "25",
        "title": "Behavioral Activation for Depression",
        "content_type": "article",
        "category": "depression",
        "description": "Using activity scheduling to combat depression and increase motivation.",
        "content_url": "https://www.apa.org/depression-guideline/behavioral-activation",
        "tags": ["depression", "activation", "treatment"]
    },
    {
        "id": "26",
        "title": "Depression and Physical Health",
        "content_type": "article",
        "category": "depression",
        "description": "Understanding the connection between depression and physical symptoms.",
        "content_url": "https://www.nimh.nih.gov/health/topics/depression",
        "tags": ["depression", "physical-health", "symptoms"]
    },
    {
        "id": "27",
        "title": "Treatment-Resistant Depression",
        "content_type": "article",
        "category": "depression",
        "description": "Options when standard treatments haven't helped.",
        "content_url": "https://www.mayoclinic.org/diseases-conditions/depression/in-depth/treatment-resistant-depression/",
        "tags": ["depression", "treatment", "options"]
    },
    {
        "id": "28",
        "title": "Depression and Social Connection",
        "content_type": "article",
        "category": "depression",
        "description": "Why social connection matters and how to maintain it during depression.",
        "content_url": "https://www.nami.org/About-Mental-Illness/Mental-Health-Conditions/Depression",
        "tags": ["depression", "social", "connection"]
    },
    {
        "id": "29",
        "title": "Depression Relapse Prevention",
        "content_type": "article",
        "category": "depression",
        "description": "Strategies to prevent depression from returning after recovery.",
        "content_url": "https://www.apa.org/topics/depression/prevention",
        "tags": ["depression", "prevention", "relapse"]
    },
    {
        "id": "30",
        "title": "Antidepressants: What to Know",
        "content_type": "article",
        "category": "depression",
        "description": "Understanding different types of antidepressants and their effects.",
        "content_url": "https://www.nimh.nih.gov/health/topics/mental-health-medications",
        "tags": ["depression", "medication", "treatment"]
    },
    {
        "id": "31",
        "title": "Depression in Different Life Stages",
        "content_type": "article",
        "category": "depression",
        "description": "How depression manifests across different ages and life circumstances.",
        "content_url": "https://www.nimh.nih.gov/health/publications/depression",
        "tags": ["depression", "life-stages", "symptoms"]
    },
    {
        "id": "32",
        "title": "Self-Care During Depression",
        "content_type": "article",
        "category": "depression",
        "description": "Practical self-care strategies when you're struggling with depression.",
        "content_url": "https://www.nami.org/Your-Journey/Individuals-with-Mental-Illness/",
        "tags": ["depression", "self-care", "wellness"]
    },
    {
        "id": "33",
        "title": "Depression and Sleep Hygiene",
        "content_type": "article",
        "category": "depression",
        "description": "Improving sleep quality to support depression recovery.",
        "content_url": "https://www.sleepfoundation.org/mental-health/depression-and-sleep",
        "tags": ["depression", "sleep", "wellness"]
    },
    
    # OCD RESOURCES (11 total)
    {
        "id": "34",
        "title": "Understanding OCD: Intrusive Thoughts and Compulsions",
        "content_type": "article",
        "category": "ocd",
        "description": "Learn about OCD symptoms, triggers, and evidence-based treatment approaches.",
        "content_url": "https://www.nimh.nih.gov/health/topics/obsessive-compulsive-disorder-ocd",
        "tags": ["ocd", "intrusive-thoughts", "compulsions"]
    },
    {
        "id": "35",
        "title": "Exposure and Response Prevention (ERP) for OCD",
        "content_type": "article",
        "category": "ocd",
        "description": "Understanding ERP therapy, the gold standard treatment for OCD.",
        "content_url": "https://iocdf.org/about-ocd/ocd-treatment/erp/",
        "tags": ["ocd", "erp", "therapy", "treatment"]
    },
    {
        "id": "36",
        "title": "Managing OCD in Daily Life",
        "content_type": "article",
        "category": "ocd",
        "description": "Practical strategies for managing OCD symptoms and reducing compulsions.",
        "content_url": "https://iocdf.org/",
        "tags": ["ocd", "management", "coping"]
    },
    {
        "id": "37",
        "title": "OCD Subtypes and Themes",
        "content_type": "article",
        "category": "ocd",
        "description": "Understanding different types of OCD including contamination, harm, and pure-O.",
        "content_url": "https://iocdf.org/about-ocd/ocd-subtypes/",
        "tags": ["ocd", "subtypes", "symptoms"]
    },
    {
        "id": "38",
        "title": "Medication for OCD",
        "content_type": "article",
        "category": "ocd",
        "description": "Understanding SSRIs and other medications used to treat OCD.",
        "content_url": "https://iocdf.org/about-ocd/ocd-treatment/medications/",
        "tags": ["ocd", "medication", "treatment"]
    },
    {
        "id": "39",
        "title": "OCD and Relationship Challenges",
        "content_type": "article",
        "category": "ocd",
        "description": "How OCD affects relationships and strategies for couples.",
        "content_url": "https://iocdf.org/about-ocd/living-with-ocd/",
        "tags": ["ocd", "relationships", "support"]
    },
    {
        "id": "40",
        "title": "Resisting Compulsions",
        "content_type": "article",
        "category": "ocd",
        "description": "Techniques for delaying and reducing compulsive behaviors.",
        "content_url": "https://iocdf.org/ocd-treatment/erp/",
        "tags": ["ocd", "compulsions", "strategies"]
    },
    {
        "id": "41",
        "title": "Pure O: Primarily Obsessional OCD",
        "content_type": "article",
        "category": "ocd",
        "description": "Understanding OCD without visible compulsions.",
        "content_url": "https://iocdf.org/about-ocd/ocd-subtypes/pure-o/",
        "tags": ["ocd", "pure-o", "symptoms"]
    },
    {
        "id": "42",
        "title": "OCD in Children and Teens",
        "content_type": "article",
        "category": "ocd",
        "description": "How OCD presents in young people and appropriate treatments.",
        "content_url": "https://iocdf.org/about-ocd/children-and-teens/",
        "tags": ["ocd", "children", "teens"]
    },
    {
        "id": "43",
        "title": "Thought-Action Fusion in OCD",
        "content_type": "article",
        "category": "ocd",
        "description": "Understanding why intrusive thoughts feel so real and dangerous.",
        "content_url": "https://iocdf.org/expert-opinions/",
        "tags": ["ocd", "thoughts", "cognitive"]
    },
    {
        "id": "44",
        "title": "OCD and Perfectionism",
        "content_type": "article",
        "category": "ocd",
        "description": "The relationship between perfectionism and OCD symptoms.",
        "content_url": "https://iocdf.org/about-ocd/",
        "tags": ["ocd", "perfectionism", "symptoms"]
    },
    
    # GENERAL/COPING RESOURCES
    {
        "id": "45",
        "title": "5-Minute Breathing Exercise",
        "content_type": "exercise",
        "category": "coping",
        "description": "A quick guided breathing exercise to reduce anxiety and promote calm.",
        "content_url": "https://www.youtube.com/watch?v=tybOi4hjZFQ",
        "tags": ["breathing", "anxiety", "mindfulness"]
    },
    {
        "id": "46",
        "title": "Cognitive Behavioral Therapy Basics",
        "content_type": "article",
        "category": "general",
        "description": "Introduction to CBT techniques for managing negative thought patterns.",
        "content_url": "https://www.apa.org/ptsd-guideline/patients-and-families/cognitive-behavioral",
        "tags": ["cbt", "therapy", "techniques"]
    },
    {
        "id": "47",
        "title": "Sleep Hygiene for Better Mental Health",
        "content_type": "article",
        "category": "general",
        "description": "How to improve sleep quality and its impact on mood and mental health.",
        "content_url": "https://www.sleepfoundation.org/sleep-hygiene",
        "tags": ["sleep", "wellness", "habits"]
    },
    {
        "id": "48",
        "title": "Supporting a Loved One with Mental Illness",
        "content_type": "article",
        "category": "caregivers",
        "description": "Guide for family and friends on how to support someone with mental health challenges.",
        "content_url": "https://www.nami.org/Your-Journey/Family-Members-and-Caregivers",
        "tags": ["caregivers", "support", "family"]
    },
    {
        "id": "49",
        "title": "Mindfulness Meditation for Beginners",
        "content_type": "audio",
        "category": "coping",
        "description": "10-minute guided meditation to practice mindfulness and reduce stress.",
        "content_url": "https://www.youtube.com/watch?v=ZToicYcHIOU",
        "tags": ["meditation", "mindfulness", "stress"]
    },
    {
        "id": "50",
        "title": "Journaling for Mental Health",
        "content_type": "exercise",
        "category": "coping",
        "description": "How to use journaling as a therapeutic tool for self-reflection and healing.",
        "content_url": "https://www.urmc.rochester.edu/encyclopedia/content.aspx?ContentID=4552&ContentTypeID=1",
        "tags": ["journaling", "self-care", "reflection"]
    },
    {
        "id": "51",
        "title": "Crisis Resources and Hotlines",
        "content_type": "article",
        "category": "general",
        "description": "Important crisis resources including the 988 Suicide & Crisis Lifeline.",
        "content_url": "https://988lifeline.org/",
        "tags": ["crisis", "emergency", "support"]
    }
]

async def seed_content():
    """Seed the content collection with mental health resources"""
    try:
        # Clear existing content
        await content_collection.delete_many({})
        
        # Insert new content
        if MENTAL_HEALTH_CONTENT:
            await content_collection.insert_many(MENTAL_HEALTH_CONTENT)
            print(f"✅ Successfully seeded {len(MENTAL_HEALTH_CONTENT)} content items")
        else:
            print("⚠️  No content to seed")
    except Exception as e:
        print(f"❌ Error seeding content: {e}")

if __name__ == "__main__":
    asyncio.run(seed_content())
