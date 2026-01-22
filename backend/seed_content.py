"""
Seed educational content into the database
"""
from database import content_collection
import asyncio

MENTAL_HEALTH_CONTENT = [
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
        "title": "Managing ADHD in Daily Life",
        "content_type": "article",
        "category": "adhd",
        "description": "Practical tips for managing ADHD symptoms including focus, organization, and time management.",
        "content_url": "https://www.additudemag.com/",
        "tags": ["adhd", "management", "focus"]
    },
    {
        "id": "3",
        "title": "Depression: Signs and Coping Strategies",
        "content_type": "article",
        "category": "depression",
        "description": "Recognize signs of depression and learn evidence-based coping techniques.",
        "content_url": "https://www.nimh.nih.gov/health/topics/depression",
        "tags": ["depression", "coping", "symptoms"]
    },
    {
        "id": "4",
        "title": "5-Minute Breathing Exercise",
        "content_type": "exercise",
        "category": "coping",
        "description": "A quick guided breathing exercise to reduce anxiety and promote calm.",
        "content_url": "https://www.youtube.com/watch?v=tybOi4hjZFQ",
        "tags": ["breathing", "anxiety", "mindfulness"]
    },
    {
        "id": "5",
        "title": "Cognitive Behavioral Therapy Basics",
        "content_type": "article",
        "category": "general",
        "description": "Introduction to CBT techniques for managing negative thought patterns.",
        "content_url": "https://www.apa.org/ptsd-guideline/patients-and-families/cognitive-behavioral",
        "tags": ["cbt", "therapy", "techniques"]
    },
    {
        "id": "6",
        "title": "Sleep Hygiene for Better Mental Health",
        "content_type": "article",
        "category": "general",
        "description": "How to improve sleep quality and its impact on mood and mental health.",
        "content_url": "https://www.sleepfoundation.org/sleep-hygiene",
        "tags": ["sleep", "wellness", "habits"]
    },
    {
        "id": "7",
        "title": "Supporting a Loved One with Mental Illness",
        "content_type": "article",
        "category": "caregivers",
        "description": "Guide for family and friends on how to support someone with mental health challenges.",
        "content_url": "https://www.nami.org/Your-Journey/Family-Members-and-Caregivers",
        "tags": ["caregivers", "support", "family"]
    },
    {
        "id": "8",
        "title": "Mindfulness Meditation for Beginners",
        "content_type": "audio",
        "category": "coping",
        "description": "10-minute guided meditation to practice mindfulness and reduce stress.",
        "content_url": "https://www.youtube.com/watch?v=ZToicYcHIOU",
        "tags": ["meditation", "mindfulness", "stress"]
    },
    {
        "id": "9",
        "title": "Recognizing Mood Episode Warning Signs",
        "content_type": "article",
        "category": "bipolar",
        "description": "Learn to identify early warning signs of manic or depressive episodes.",
        "content_url": "https://www.dbsalliance.org/education/bipolar-disorder/",
        "tags": ["bipolar", "warning-signs", "prevention"]
    },
    {
        "id": "10",
        "title": "ADHD and Emotional Regulation",
        "content_type": "article",
        "category": "adhd",
        "description": "Understanding the connection between ADHD and emotional dysregulation.",
        "content_url": "https://chadd.org/about-adhd/overview/",
        "tags": ["adhd", "emotions", "regulation"]
    },
    {
        "id": "11",
        "title": "Journaling for Mental Health",
        "content_type": "exercise",
        "category": "coping",
        "description": "How to use journaling as a therapeutic tool for self-reflection and healing.",
        "content_url": "https://www.urmc.rochester.edu/encyclopedia/content.aspx?ContentID=4552&ContentTypeID=1",
        "tags": ["journaling", "self-care", "reflection"]
    },
    {
        "id": "12",
        "title": "Crisis Resources and Hotlines",
        "content_type": "article",
        "category": "general",
        "description": "Important crisis resources including the 988 Suicide & Crisis Lifeline.",
        "content_url": "https://988lifeline.org/",
        "tags": ["crisis", "emergency", "support"]
    },
    {
        "id": "13",
        "title": "Understanding OCD: Intrusive Thoughts and Compulsions",
        "content_type": "article",
        "category": "ocd",
        "description": "Learn about OCD symptoms, triggers, and evidence-based treatment approaches.",
        "content_url": "https://www.nimh.nih.gov/health/topics/obsessive-compulsive-disorder-ocd",
        "tags": ["ocd", "intrusive-thoughts", "compulsions"]
    },
    {
        "id": "14",
        "title": "Exposure and Response Prevention (ERP) for OCD",
        "content_type": "article",
        "category": "ocd",
        "description": "Understanding ERP therapy, the gold standard treatment for OCD.",
        "content_url": "https://iocdf.org/about-ocd/ocd-treatment/erp/",
        "tags": ["ocd", "erp", "therapy", "treatment"]
    },
    {
        "id": "15",
        "title": "Managing OCD in Daily Life",
        "content_type": "article",
        "category": "ocd",
        "description": "Practical strategies for managing OCD symptoms and reducing compulsions.",
        "content_url": "https://iocdf.org/",
        "tags": ["ocd", "management", "coping"]
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
